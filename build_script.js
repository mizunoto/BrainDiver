import * as fs from "fs/promises";
import * as path from "path";
import { MarkdownTextSplitter } from "langchain/text_splitter";
import { Document } from "langchain/document";
import { createWriteStream } from "fs";
import archiver from "archiver";

const levelPrefix = 'level';

async function getMarkdownFiles(dir) {
    const dirents = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
        dirents.map((dirent) => {
            const res = path.resolve(dir, dirent.name);
            return dirent.isDirectory() ? getMarkdownFiles(res) : res;
        })
    );
    return Array.prototype.concat(...files).filter((file) => file.endsWith(".md"));
}

/**
 * レベル名からメタデータを生成するヘルパー関数
 * @param {string} levelName - 'level0', 'level3' などのレベル名
 * @param {string} sourcePath - ファイルの相対パス
 * @returns {object} - メタデータオブジェクト
 */
function getMetadataFromLevel(levelName, sourcePath) {
    const isSecret = levelName !== `${levelPrefix}0`;
    return {
        source: sourcePath,
        access: isSecret ? 'secret' : 'public',
        access_level: Number(levelName.replace(levelPrefix, '')),
    };
}

async function main() {
    // --- ステップ0: バージョンとパスの準備 ---
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));
    const version = packageJson.version;
    console.log(`プロジェクトバージョン: ${version} のビルドを開始します...`);

    const sourceDir = path.join(process.cwd(), "source");
    const outputDir = path.join(process.cwd(), "dist");
    const releaseDir = path.join(outputDir, "releases", version); // リリース用フォルダ

    const dbOutputFile = path.join(outputDir, "rag_database.json");
    const fullRuleOutputFilename = `BrainDiver_Complete_Rulebook_v${version}.md`;
    const fullRuleOutputFile = path.join(releaseDir, fullRuleOutputFilename);
    const handoutOutputFilename = `BrainDiver_Player_Handout_v${version}.md`;
    const handoutOutputFile = path.join(releaseDir, handoutOutputFilename);
    const dbReleaseFilename = `rag_database_v${version}.json`;
    const dbReleaseFile = path.join(releaseDir, dbReleaseFilename);
    const zipOutputFilename = `BrainDiver_Release_v${version}.zip`;
    const zipOutputFile = path.join(releaseDir, zipOutputFilename);

    // --- ステップ1: rag_database.json の生成 (既存のロジック) ---
    console.log("\n[1/3] RAGデータベースを生成中...");
    // (ここのロジックは非常に長いため、省略しますが、v8のままで変更ありません)
    const allFiles = await getMarkdownFiles(sourceDir);
    console.log(`発見したファイル数: ${allFiles.length}`);

    const allChunks = [];
    const splitter = new MarkdownTextSplitter({
        headersToSplitOn: [
            ["#", "Header1"],
            ["##", "Header2"],
            ["###", "Header3"],
        ],
        returnIntermediateDocuments: false,
    });

    const secretTagRegex = new RegExp('<!--\s*SECRET:\s*(level\d+)\s*', 'g');

    for (const filePath of allFiles) {
        console.log(`処理中: ${filePath}`);
        const fileContent = await fs.readFile(filePath, "utf-8");
        const relativePath = path.relative(sourceDir, filePath);
        const pathParts = relativePath.split(path.sep);

        // --- ファイルパスからデフォルトのレベルを決定 ---
        // publicフォルダ内ならlevel0、それ以外（secret/private）ならlevel1をデフォルトとする
        const isPublic = pathParts[0] === 'public';
        let currentLevel = isPublic ? 'level0' : 'level1';


        const blocks = fileContent.split(secretTagRegex);
        let textAccumulator = blocks[0];

        for (let i = 1; i < blocks.length; i += 2) {
            const nextLevel = blocks[i];
            const textAfterTag = blocks[i + 1] || '';

            if (textAccumulator.trim()) {
                const metadata = getMetadataFromLevel(currentLevel, relativePath);
                const doc = new Document({ pageContent: textAccumulator, metadata });
                const splitDocs = await splitter.splitDocuments([doc]);
                allChunks.push(...splitDocs);
            }

            currentLevel = nextLevel;
            textAccumulator = textAfterTag;
        }

        // 最後のブロックを処理
        if (textAccumulator.trim()) {
            const metadata = getMetadataFromLevel(currentLevel, relativePath);
            const doc = new Document({ pageContent: textAccumulator, metadata });
            const splitDocs = await splitter.splitDocuments([doc]);
            allChunks.push(...splitDocs);
        }
    }
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(dbOutputFile, JSON.stringify(allChunks, null, 2));
    console.log(` -> ${dbOutputFile} に保存しました。`);

    // --- ステップ2: 単一Markdownファイルの生成 (新規ロジック) ---
    console.log("\n[2/3] リリース用Markdownファイルを生成中...");
    await fs.mkdir(releaseDir, { recursive: true });

    // 結合するファイルの順番を定義
    const orderedFiles = [
        "public/protocol.md",
        "public/archive.md",
        "secret/deep_log.md",
        "secret/compiler.md",
    ];

    let completeMarkdownContent = "";
    for (const file of orderedFiles) {
        const filePath = path.join(sourceDir, file);
        const content = await fs.readFile(filePath, "utf-8");
        completeMarkdownContent += content + "\n\n---\n\n"; // ファイル間に区切り線を入れる
    }

    const args = process.argv.slice(2); // コマンドライン引数を取得
    if (!args.includes('noRelease')) {
        await fs.writeFile(fullRuleOutputFile, completeMarkdownContent);
        console.log(` -> ${fullRuleOutputFile} に保存しました。`);
        await fs.writeFile(handoutOutputFile, completeMarkdownContent);
        console.log(` -> ${handoutOutputFile} に保存しました。`);
        await fs.writeFile(dbReleaseFile, completeMarkdownContent);
        console.log(` -> ${dbReleaseFile} に保存しました。`);

        // --- ステップ3: ZIPパッケージの生成 (新規ロジック) ---
        console.log("\n[3/3] ZIPリリースパッケージを生成中...");
        const output = createWriteStream(zipOutputFile);
        const archive = archiver('zip', { zlib: { level: 9 } }); // 高圧縮

        await new Promise((resolve, reject) => {
            output.on('close', resolve);
            archive.on('error', reject);

            archive.pipe(output);
            // ZIPに含めるファイルを追加
            archive.file(dbOutputFile, { name: dbReleaseFilename });
            archive.file(fullRuleOutputFile, { name: fullRuleOutputFilename });
            archive.file(handoutOutputFile, { name: handoutOutputFilename });
            archive.finalize();
        });

        console.log(` -> ${zipOutputFile} に保存しました。`);
    } else {
        console.log('リリースファイルの出力をスキップします。');
    }

    console.log(`\nビルドプロセスが完了しました！`);
}

main().catch(console.error);