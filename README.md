# rename-ja

Claude Code の `/rename` を引数なしで実行したときに、会話の内容から日本語のセッション名を付ける mod です。

組み込みの `/rename` は、英小文字の kebab-case（例: `fix-login-bug`）で名前を生成します。この mod は、その名前を日本語に置き換えます。

| 入力 | mod なし | mod あり |
| --- | --- | --- |
| `/rename` | `typescript-remove-duplicates` | `配列の重複除去方法` |
| `/rename 好きな名前` | `好きな名前` | `好きな名前` |

名前を指定した `/rename` の動作は変わりません。

## 前提条件

この mod は、Claude Code の function hooks を使います。function hooks は early access の機能で、既定では無効です。

`~/.claude/settings.json` の `env` に次の 1 行を追加して、Claude Code を再起動してください。

```json
{
  "env": {
    "CLAUDE_CODE_ENABLE_FUNCTION_HOOKS": "1"
  }
}
```

1 回だけ試す場合は、環境変数を付けて起動します。

```sh
CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 claude
```

動作を確認した Claude Code のバージョンは 2.1.286 です。これより古いバージョンは、mod が使う API の形が異なるため、動かない可能性があります。

## インストール

```sh
claude plugin marketplace add tomatoaiu/rename-ja
claude plugin install rename-ja@tomatoaiu-mods
```

インストール後に Claude Code を再起動すると、mod が読み込まれます。

## 使い方

1. Claude Code で 1 往復以上会話します。
2. `/rename` を引数なしで実行します。

画面には `/rename <生成された名前>` と表示されます。mod が生成した名前を引数に入れてから、組み込みの `/rename` に渡しているためです。

## 仕組み

mod は `command.run` イベントを `rename` コマンドに限定して hook します。

- 引数が空のときだけ、会話の本文を Haiku に渡して、20 文字以内の日本語名を 1 つ生成します。
- 会話が長い場合、mod は冒頭 2000 字と末尾 4000 字だけを Haiku に渡します。
- 生成に失敗した場合、mod は何も書き換えず、組み込みの `/rename` が英語名を付けます。

## 注意点

- function hooks の API は、Claude Code の更新で予告なく変わる可能性があります。API が変わると、この mod は失敗し、`/rename` は組み込みの英語名に戻ります。
- mod は、会話の抜粋を Haiku に送信します。送信には、セッションと同じ API クライアントと認証情報を使います。
- `/rename` を引数なしで 1 回実行するたびに、Haiku の呼び出しが 1 回発生します。

## 更新とアンインストール

```sh
claude plugin update rename-ja@tomatoaiu-mods
claude plugin uninstall rename-ja@tomatoaiu-mods
```

## ライセンス

[MIT](LICENSE)
