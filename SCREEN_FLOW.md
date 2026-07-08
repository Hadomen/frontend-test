# 画面遷移図

## 遷移フロー

```mermaid
flowchart LR
    A["① 氏名入力\n(/)"] -->|次へ| B["② 生年月日選択\n(/)"]
    B -->|戻る| A
    B -->|次へ| C["③ 確認\n(/)"]
    C -->|戻る| B
    C -->|登録する<br/>POST /api/user| D["④ 完了\n(/)"]
    D -->|もう一度入力する| A
    D -->|一覧を見る| E["⑤ 登録一覧\n(/list)"]
    E -->|登録フォーム| A
```

- ①〜④は同一ページ(`/`)内で[Wizard.tsx](src/components/Wizard.tsx)が`useState`のステップ管理だけで切り替えており、ページ遷移(リロード)は発生しない。
- ④→⑤、ヘッダーのナビ(「登録フォーム」「登録一覧」)は`next/link`によるクライアントサイド遷移で、こちらもフルリロードなし。
- ③→④のタイミングでのみ、`fetch`によるバックエンドとの通信(DBへの登録)が発生する。

## 各画面

### ① 氏名入力

苗字・名前を入力する画面。[NameStep.tsx](src/components/wizard/NameStep.tsx)

![氏名入力画面](docs/screenshots/01-name.png)

### ② 生年月日選択

生年月日を選択する画面。[BirthDateStep.tsx](src/components/wizard/BirthDateStep.tsx)

![生年月日選択画面](docs/screenshots/02-birthdate.png)

### ③ 確認

入力内容を確認し、「登録する」で送信する画面。[ConfirmStep.tsx](src/components/wizard/ConfirmStep.tsx)

![確認画面](docs/screenshots/03-confirm.png)

### ④ 完了

登録完了後の画面。「一覧を見る」で登録一覧へ、「もう一度入力する」で①に戻る。[CompleteStep.tsx](src/components/wizard/CompleteStep.tsx)

![完了画面](docs/screenshots/04-complete.png)

### ⑤ 登録一覧

DBに登録済みの全データをカード形式で一覧表示する画面。[list/page.tsx](src/app/list/page.tsx)

![登録一覧画面](docs/screenshots/05-list.png)
