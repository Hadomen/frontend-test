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
| `/` | トップメニュー(「新規登録」「登録一覧を見る」への導線) |
| `/register` | 登録ステップフォーム(氏名 → 生年月日 → 確認 → 完了) |
| `/list` | 登録済みデータの一覧表示 |
| `/api/user` | `GET`(一覧取得) / `POST`(新規登録)のAPIルート |

## ディレクトリ構成

```
src/
  app/
    layout.tsx          # 共通レイアウト(Header/Footerを読み込むだけ)
    page.tsx             # "/" (トップメニュー: 新規登録 / 登録一覧への導線)
    register/page.tsx     # "/register" (RegisterStepFormを描画)
    list/page.tsx         # "/list" (サーバーコンポーネント、Prismaで直接クエリ)
    api/user/route.ts  # "/api/user" (登録API, GET/POST)
  components/
    RegisterStepForm.tsx  # 4ステップの状態管理・ステップ切り替えを行う制御役(クライアントコンポーネント)
    Header.tsx            # ヘッダー(トップへのリンクのみ)
    Footer.tsx            # フッター
    register-step-form/    # 登録ステップフォームの各ステップ画面
      types.ts              # FormData / Stepの型定義
      StepIndicator.tsx      # 上部の進捗バー
      NameStep.tsx           # 氏名入力画面
      BirthDateStep.tsx      # 生年月日選択画面
      ConfirmStep.tsx        # 確認画面
      CompleteStep.tsx       # 完了画面
    ui/                    # shadcn/uiのコンポーネント(button, input, label, card)
  lib/
    prisma.ts             # PrismaClientのシングルトン(better-sqlite3アダプタ経由)
    utils.ts              # shadcn/ui用のclassName結合ヘルパー(cn)
  generated/prisma/        # `prisma generate` の出力(Prisma Client本体・型)
  stories/
    register-step-form/    # 各ステップのStorybookプレビュー定義(*.stories.tsx)
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

`layout.tsx`自体にはヘッダー・フッターの中身を直接書かず、[Header.tsx](src/components/Header.tsx) / [Footer.tsx](src/components/Footer.tsx)として`components/`に切り出し、`layout.tsx`は`<Header />` / `<Footer />`を並べるだけの骨組みにしている。

## レンダリングについて

このプロジェクトでは2種類のレンダリングが組み合わさって動いている。

- **サーバーサイドレンダリング(SSR)**: 各ページに最初にアクセスしたとき、Next.jsがサーバー側で`page.tsx`をHTMLに変換して返す。[list/page.tsx](src/app/list/page.tsx)は`export const dynamic = "force-dynamic"`にしているため、アクセスのたびにサーバーでPrismaから最新のDBの内容を取得してHTMLを生成し直す。
- **クライアントサイドの再レンダリング**: [RegisterStepForm.tsx](src/components/RegisterStepForm.tsx)は`"use client"`なので、ブラウザに届いた後はReactが動き、`setStep(...)`のように状態が変わるたびにReactがその部分のDOMを再レンダリングする。ブラウザのページ遷移(リロード)とは無関係で、あくまでJavaScript内でのReactの再描画。

「ページ遷移(リロード)が起きない」ことと「レンダリングが起きない」ことは別の話で、登録ステップフォームの各ステップ切り替えは常にクライアントサイドで再レンダリングされ続けている。

## SPA(登録ステップフォーム)の作り

- [RegisterStepForm.tsx](src/components/RegisterStepForm.tsx) は `"use client"` コンポーネントで、`useState` で4つのステップ(`name` / `birthDate` / `confirm` / `complete`)を管理する。
- ステップ間の遷移はページ遷移を伴わず、同一コンポーネント内の状態切り替えのみで行われる(URLもHTMLも変わらない)。
- 「登録する」ボタン押下時は `fetch("/api/user", { method: "POST" })` でバックエンドと非同期通信し、成功したら `setStep("complete")` で完了画面に切り替える。ページ全体のリロードは発生しない。
- 一覧ページへの遷移は `next/link` の `<Link>` を使用しており、Next.jsのクライアントサイドルーティングによりフルリロードなしで画面が切り替わる。
- 各ステップ(`NameStep` / `BirthDateStep` / `ConfirmStep` / `CompleteStep`)は`form`や`onChange`などをpropsで受け取るだけの部品で、状態は持たない。実際の状態は`RegisterStepForm.tsx`側で一元管理している。

## UI部品 (shadcn/ui)

- `npx shadcn@latest init` で導入。
- `Button` / `Input` / `Label` / `Card`(`CardHeader` / `CardTitle` / `CardContent`)を`src/components/ui/`に生成し、[RegisterStepForm.tsx](src/components/RegisterStepForm.tsx)・[list/page.tsx](src/app/list/page.tsx)で使用。
- Base UIの`Button`はデフォルトで実際の`<button>`要素が描画される前提(`nativeButton: true`)になっている。`render`プロップ(Radixの`asChild`相当)で`next/link`の`<Link>`をボタン風に描画する場合、`<a>`タグになり前提が崩れるため、`nativeButton={false}`を明示的に指定する必要がある(例: 完了画面の「一覧を見る」ボタン)。

## コンポーネント単体プレビュー (Storybook)

- `src/components/register-step-form/`配下の各ステップは、propsを受け取るだけの部品として作られているため、本番のフロー(`RegisterStepForm.tsx`)を介さずに単体でプレビューできる。
- Storybook用のプレビュー定義は`src/stories/register-step-form/*.stories.tsx`に、コンポーネント本体とは別フォルダで配置している。呼び出し元がいないステップ(`onChange`や`onNext`などのpropsが必要なもの)には、ダミーの`useState`を持つ`Wrapper`コンポーネントを用意し、本物のRegisterStepFormの代わりに値を渡している。
- `npm run storybook` で起動し、`http://localhost:6006` でブラウザから各ステップを個別に確認できる。
- `.storybook/preview.tsx` で`globals.css`を読み込み、Tailwind/shadcn-uiのスタイルがStorybook上でも本番と同じ見た目になるようにしている。

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

- トップメニュー: http://localhost:3000
- 登録ステップフォーム: http://localhost:3000/register
- 登録一覧: http://localhost:3000/list

## 型・生成コード

- `src/generated/prisma/` は `npx prisma generate` によって自動生成される(スキーマ変更後は再実行が必要)。
