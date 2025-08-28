import * as fs from "fs/promises";
import * as path from "path";
import { MarkdownTextSplitter } from "langchain/text_splitter";
import { Document } from "langchain/document";

// ... getMarkdownFiles関数は変更なし ...
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

  // 正規表現で<!-- SECRET: ... -->タグを捉える
  const secretTagRegex = /<!--\s*SECRET:\s*([\w-]+)\s*-->/g;

  for (const filePath of allFiles) {
    console.log(`処理中: ${filePath}`);
    const fileContent = await fs.readFile(filePath, "utf-8");
    const relativePath = path.relative(sourceDir, filePath);

    // --- ここからが新しいロジック ---
    // SECRETタグでファイルをブロックに分割する
    const blocks = fileContent.split(secretTagRegex);

    let currentLevel = 'public'; // デフォルトのレベル
    // splitの仕様上、最初の要素は最初のタグより前のテキスト
    let textAccumulator = blocks[0]; 

    // `[テキスト, レベル, テキスト, レベル, ...]` の形式でループ処理
    for (let i = 1; i < blocks.length; i += 2) {
      const nextLevel = blocks[i];
      const textAfterTag = blocks[i + 1] || '';

      // 現在のレベルのテキストが溜まったら、それを処理する
      if (textAccumulator.trim()) {
        const metadata = {
          source: relativePath,
          access_level: currentLevel.startsWith('star_') ? 'secret' : 'public',
        };
        if (metadata.access_level === 'secret') {
          metadata.star_level = currentLevel;
        }

        const doc = new Document({ pageContent: textAccumulator, metadata });
        const splitDocs = await splitter.splitDocuments([doc]);
        allChunks.push(...splitDocs);
      }
      
      // 次のブロックのためにレベルを更新し、テキストをリセット
      currentLevel = nextLevel;
      textAccumulator = textAfterTag;
    }
    
    // 最後のブロックを処理
    if (textAccumulator.trim()) {
      const metadata = {
        source: relativePath,
        access_level: currentLevel.startsWith('star_') ? 'secret' : 'public',
      };
       if (metadata.access_level === 'secret') {
          metadata.star_level = currentLevel;
        }
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