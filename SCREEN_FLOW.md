# 画面遷移図

## 遷移フロー

```mermaid
flowchart LR
    T["⓪ トップ\n(/)"] -->|新規登録| A["① 氏名入力\n(/register)"]
    T -->|登録一覧を見る| E["⑤ 登録一覧\n(/list)"]
    A -->|次へ| B["② 生年月日選択\n(/register)"]
    B -->|戻る| A
    B -->|次へ| C["③ 確認\n(/register)"]
    C -->|戻る| B
    C -->|登録する<br/>POST /api/user| D["④ 完了\n(/register)"]
    D -->|もう一度入力する| A
    D -->|一覧を見る| E
    E -->|登録フォーム| T
```

- ①〜④は同一ページ(`/register`)内で[RegisterStepForm.tsx](src/components/RegisterStepForm.tsx)が`useState`のステップ管理だけで切り替えており、ページ遷移(リロード)は発生しない。
- ⓪→①、⓪→⑤、④→⑤、ヘッダーの「登録フォーム」タイトル(トップへのリンク)は`next/link`によるクライアントサイド遷移で、こちらもフルリロードなし。画面間の移動はトップ画面のボタンとステップフォームの「戻る」「一覧を見る」だけで行い、ヘッダーには個別のナビリンクを置いていない。
- ③→④のタイミングでのみ、`fetch`によるバックエンドとの通信(DBへの登録)が発生する。

## 各画面

### ⓪ トップ

「新規登録」「登録一覧を見る」への導線だけを持つメニュー画面。[page.tsx](src/app/page.tsx)

![トップ画面](docs/screenshots/00-top.png)

### ① 氏名入力

苗字・名前を入力する画面。[NameStep.tsx](src/components/register-step-form/NameStep.tsx)

![氏名入力画面](docs/screenshots/01-name.png)

### ② 生年月日選択

生年月日を選択する画面。[BirthDateStep.tsx](src/components/register-step-form/BirthDateStep.tsx)

![生年月日選択画面](docs/screenshots/02-birthdate.png)

### ③ 確認

入力内容を確認し、「登録する」で送信する画面。[ConfirmStep.tsx](src/components/register-step-form/ConfirmStep.tsx)

![確認画面](docs/screenshots/03-confirm.png)

### ④ 完了

登録完了後の画面。「一覧を見る」で登録一覧へ、「もう一度入力する」で①に戻る。[CompleteStep.tsx](src/components/register-step-form/CompleteStep.tsx)

![完了画面](docs/screenshots/04-complete.png)

### ⑤ 登録一覧

DBに登録済みの全データをカード形式で一覧表示する画面。[list/page.tsx](src/app/list/page.tsx)

![登録一覧画面](docs/screenshots/05-list.png)
