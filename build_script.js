import * as fs from "fs/promises";
import * as path from "path";
import { MarkdownTextSplitter } from "langchain/text_splitter";
// VVVVVV この行を追加しました VVVVVV
import { Document } from "langchain/document";
// ^^^^^^ この行を追加しました ^^^^^^


/**
 * 指定されたディレクトリ内の全てのMarkdownファイルのパスを再帰的に取得します。
 * @param {string} dir - 検索を開始するディレクトリ
 * @returns {Promise<string[]>} - Markdownファイルのパスの配列
 */
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
 * メインのビルド処理を実行する関数
 */
async function main() {
    const sourceDir = path.join(process.cwd(), "source");
    const outputDir = path.join(process.cwd(), "dist");
    const outputFile = path.join(outputDir, "rag_database.json");

    console.log("ビルドプロセスを開始します...");
    console.log(`入力ディレクトリ: ${sourceDir}`);

    const allFiles = await getMarkdownFiles(sourceDir);
    if (allFiles.length === 0) {
        console.log("処理対象のMarkdownファイルが見つかりませんでした。");
        return;
    }
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

    for (const filePath of allFiles) {
        console.log(`処理中: ${filePath}`);
        const fileContent = await fs.readFile(filePath, "utf-8");

        // VVVVVV ここからロジックを全面的に修正しました VVVVVV

        // --- ステップ1: ファイルパスからベースとなるメタデータを作成 ---
        const relativePath = path.relative(sourceDir, filePath);
        const pathParts = relativePath.split(path.sep);
        const baseMetadata = {
            source: relativePath,
            access_level: pathParts[pathParts.length - 2],
        };
        if (baseMetadata.access_level === "secret" && pathParts.length > 1) {
            baseMetadata.star_level = pathParts[1];
        }

        // --- ステップ2: ファイル全体を一つの大きなDocumentオブジェクトとして初期化 ---
        const initialDocument = new Document({
            pageContent: fileContent,
            metadata: baseMetadata,
        });

        // --- ステップ3: splitter.splitDocuments() を使って分割 ---
        // このメソッドが、ヘッダー情報を抽出し、元のメタデータと自動で結合してくれます。
        const splitDocuments = await splitter.splitDocuments([initialDocument]);

        // --- ステップ4: 分割されたドキュメントを結果の配列に追加 ---
        allChunks.push(...splitDocuments);

        // ^^^^^^ ここまでロジックを全面的に修正しました ^^^^^^
    }

    // 結果をJSONファイルとして出力
    await fs.mkdir(outputDir, { recursive: true });
    // LangChainのDocumentオブジェクトはそのままJSON化できるので、一手間減らせます。
    await fs.writeFile(outputFile, JSON.stringify(allChunks, null, 2));

    console.log("\nビルドプロセスが完了しました。");
    console.log(`合計チャンク数: ${allChunks.length}`);
    console.log(`出力ファイル: ${outputFile}`);
}

main().catch(console.error);