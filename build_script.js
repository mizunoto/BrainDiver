import * as fs from "fs/promises";
import * as path from "path";
import { MarkdownTextSplitter } from "langchain/text_splitter";
import { Document } from "langchain/document";

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
 * @param {string} levelName - 'public', 'star_3' などのレベル名
 * @param {string} sourcePath - ファイルの相対パス
 * @returns {object} - メタデータオブジェクト
 */
function getMetadataFromLevel(levelName, sourcePath) {
    const isSecret = levelName.startsWith('level');
    const metadata = {
        source: sourcePath,
        access_level: levelName !== 'level0' ? 'secret' : 'public',
    };
    if (isSecret) {
        metadata.star_level = levelName;
    }
    return metadata;
}

async function main() {
    const sourceDir = path.join(process.cwd(), "source");
    const outputDir = path.join(process.cwd(), "dist");
    const outputFile = path.join(outputDir, "rag_database.json");

    console.log("ビルドプロセスを開始します...");

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

    const secretTagRegex = /<!--\s*SECRET:\s*([\w-]+)\s*-->/g;

    for (const filePath of allFiles) {
        console.log(`処理中: ${filePath}`);
        const fileContent = await fs.readFile(filePath, "utf-8");
        const relativePath = path.relative(sourceDir, filePath);
        const pathParts = relativePath.split(path.sep);

        // VVVVVV ここからが新しいロジック VVVVVV

        // --- ステップ1: ファイルパスからデフォルトのレベルを決定 ---
        let currentLevel = 'level0';
        if (pathParts[0] === 'secret' && pathParts.length > 1) {
            // 例: 'secret/star_3/file.md' -> 'star_3'
            currentLevel = pathParts[1];
        }

        // --- ステップ2: SECRETタグでファイルをブロックに分割 ---
        const blocks = fileContent.split(secretTagRegex);
        let textAccumulator = blocks[0]; // 最初のタグより前のテキスト

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

    // 結果をJSONファイルとして出力
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(outputFile, JSON.stringify(allChunks, null, 2));

    console.log("\nビルドプロセスが完了しました。");
    console.log(`合計チャンク数: ${allChunks.length}`);
    console.log(`出力ファイル: ${outputFile}`);
}

main().catch(console.error);