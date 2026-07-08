# 技術スタックと構成

## 技術スタック

| 分類 | 技術 |
| --- | --- |
| フレームワーク | Next.js 16 (App Router) |
| 言語 | TypeScript |
| UI / スタイリング | React 19, Tailwind CSS 4, shadcn/ui (Base UIベース) |
| DB | SQLite (`dev.db`) |
| ORM | Prisma 7 (`prisma-client` generator) |
| DBアダプタ | `@prisma/adapter-better-sqlite3` |

## 画面構成

| パス | 役割 |
| --- | --- |
| `/` | 登録ウィザード(氏名 → 生年月日 → 確認 → 完了) |
| `/list` | 登録済みデータの一覧表示 |
| `/api/user` | `GET`(一覧取得) / `POST`(新規登録)のAPIルート |

## ディレクトリ構成

```
src/
  app/
    layout.tsx          # 共通レイアウト(Header/Footerを読み込むだけ)
    page.tsx             # "/" (Wizardを描画)
    list/page.tsx         # "/list" (サーバーコンポーネント、Prismaで直接クエリ)
    api/user/route.ts  # "/api/user" (登録API, GET/POST)
  components/
    Wizard.tsx            # 4ステップのSPAウィザード本体(クライアントコンポーネント)
    Header.tsx            # ヘッダー(ナビ: 登録フォーム / 登録一覧)
    Footer.tsx            # フッター
    ui/                    # shadcn/uiのコンポーネント(button, input, label, card)
  lib/
    prisma.ts             # PrismaClientのシングルトン(better-sqlite3アダプタ経由)
    utils.ts              # shadcn/ui用のclassName結合ヘルパー(cn)
  generated/prisma/        # `prisma generate` の出力(Prisma Client本体・型)
prisma/
  schema.prisma           # Entryモデル定義
  migrations/             # マイグレーション履歴
components.json           # shadcn/uiの設定(エイリアス・スタイル等)
dev.db                    # SQLiteのデータファイル
```

## App Routerのルーティングの仕組み

Next.jsの App Router では、`src/app/` 配下のフォルダ階層がそのままURLパスに対応する。

- フォルダ階層 = URLパス階層(例: `app/list/page.tsx` → `/list`)
- そのフォルダに置くファイルの種類によって役割が決まる
  - `page.tsx` … そのパスの画面(UI)になる
  - `route.ts` … そのパスをAPIエンドポイント(ハンドラ)にする。画面ではなく`GET`/`POST`等の関数をexportする
  - `layout.tsx` … 配置したフォルダ以下すべてのページに共通で適用されるレイアウト
- 旧来の`pages/`ディレクトリ方式(Next.js 12以前の主流)とは別の仕組みで、ファイル名の中身によって役割が変わる点が特徴。

このプロジェクトでは`create-next-app`実行時に`--src-dir`を指定したため、ルーティングの起点は`app/`ではなく`src/app/`になっている。

`layout.tsx`自体にはヘッダー・フッターの中身を直接書かず、[Header.tsx](src/components/Header.tsx) / [Footer.tsx](src/components/Footer.tsx)として`components/`に切り出し、`layout.tsx`は`<Header />` / `<Footer />`を並べるだけの骨組みにしている。

## SPA(ウィザード)の作り

- [Wizard.tsx](src/components/Wizard.tsx) は `"use client"` コンポーネントで、`useState` で4つのステップ(`name` / `birthDate` / `confirm` / `complete`)を管理する。
- ステップ間の遷移はページ遷移を伴わず、同一コンポーネント内の状態切り替えのみで行われる(URLもHTMLも変わらない)。
- 「登録する」ボタン押下時は `fetch("/api/user", { method: "POST" })` でバックエンドと非同期通信し、成功したら `setStep("complete")` で完了画面に切り替える。ページ全体のリロードは発生しない。
- 一覧ページへの遷移は `next/link` の `<Link>` を使用しており、Next.jsのクライアントサイドルーティングによりフルリロードなしで画面が切り替わる。

## UI部品 (shadcn/ui)

- `npx shadcn@latest init` で導入。Radix UIではなく **Base UI** (`@base-ui/react`) をプリミティブとして使う構成(`components.json`の`style: "base-nova"`)。
- `Button` / `Input` / `Label` / `Card`(`CardHeader` / `CardTitle` / `CardContent`)を`src/components/ui/`に生成し、[Wizard.tsx](src/components/Wizard.tsx)・[list/page.tsx](src/app/list/page.tsx)で使用。
- Base UIの`Button`はデフォルトで実際の`<button>`要素が描画される前提(`nativeButton: true`)になっている。`render`プロップ(Radixの`asChild`相当)で`next/link`の`<Link>`をボタン風に描画する場合、`<a>`タグになり前提が崩れるため、`nativeButton={false}`を明示的に指定する必要がある(例: 完了画面の「一覧を見る」ボタン)。
- 配色は`globals.css`のCSS変数(`--background`、`--primary`、`--muted-foreground`など)で管理され、Tailwindの`bg-background`/`text-foreground`のようなユーティリティクラス経由で参照する。ダークモードは`.dark`クラス配下の変数上書きで対応。

## データモデル (`prisma/schema.prisma`)

```prisma
model Entry {
  id        Int      @id @default(autoincrement())
  lastName  String
  firstName String
  birthDate DateTime
  createdAt DateTime @default(now())
}
```

## API仕様

### `GET /api/user`
登録済み全件を `createdAt` 降順で返す。

### `POST /api/user`
リクエストボディ:
```json
{ "lastName": "山田", "firstName": "太郎", "birthDate": "1990-05-15" }
```
バリデーション(苗字・名前が空でない、生年月日が日付として解釈可能)を満たさない場合は `400` を返す。成功時は作成した `Entry` を `201` で返す。

## セットアップ・起動

```bash
npm install
npx prisma migrate deploy   # DBスキーマ適用(初回のみ)
npm run dev
```

- ウィザード: http://localhost:3000
- 登録一覧: http://localhost:3000/list

## 型・生成コード

- `src/generated/prisma/` は `npx prisma generate` によって自動生成される(スキーマ変更後は再実行が必要)。`.gitignore` により追跡対象外。
- DBファイル `dev.db` も `.gitignore` で除外されている(ローカル環境ごとに `prisma migrate deploy` で再生成する想定)。
