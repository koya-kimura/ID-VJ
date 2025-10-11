## ID-VJ

ID-VJはp5.jsとWebGLシェーダーで構成されたライブVJプロジェクトです。AKAI APC Mini MK2を想定したリアルタイム操作と、シーン／UI／ポストエフェクトを簡単に差し替えられる設定ファイル群を備えています。

## 特徴

- 8シーン構成のVJセットをTypeScriptで実装
- AKAI APC Mini MK2を前提としたLEDフィードバック付き操作
- MIDIが利用できない環境でも使えるキーボードフォールバック
- シーン・UI・ポストエフェクトを設定ファイルから差し替え可能
- Viteベースの開発環境で素早くプレビュー

## 必要環境

- Node.js18以上（Vite7の推奨要件に準拠）
- npm9以上
- Web MIDI APIに対応したブラウザ（Chrome/Edge系など）
- AKAI APC Mini MK2（任意、ない場合はキーボード操作で代用可能）

## セットアップ

1. リポジトリをクローンします。
2. 依存関係をインストールします。

```bash
npm install
```

## 開発サーバーの起動

ローカルで即座にプレビューするには開発サーバーを起動します。

```bash
npm run dev
```

コマンド実行後に表示されるURL（通常はhttp://localhost:5173/）へアクセスし、MIDIの使用許可をブラウザで与えてください。AKAI APC Mini MK2を接続している場合はUSB経由で接続した状態でページを開いてください。

## ビルドとプレビュー

本番ビルドとビルド結果のプレビューには以下を使用します。

```bash
npm run build   # TypeScriptの型チェック + 本番ビルド
npm run preview # distディレクトリをローカル配信
```

## テンプレートジェネレーター (.command)

新しいシーンやUIオーバーレイを追加するときは、`tools/generate-vj-entry.command` を利用するとテンプレートから自動生成できます。

1. 初回のみ実行権限を付与します。
	```bash
	chmod +x tools/generate-vj-entry.command
	```
2. スクリプトを実行します（ダブルクリックまたはターミナルで実行）。
3. `scene` か `ui` を選択し、PascalCaseのベース名を入力します。
	- `Scene`/`Overlay` 接尾辞は自動で付与されます。
4. `src/scenes` もしくは `src/ui` にファイルが生成されます。
5. 忘れずに以下の設定へクラスを追加してください。
	- シーン: `src/config/sceneConfig.ts` の `DEFAULT_SCENE_LIBRARY`
	- UI: `src/config/uiConfig.ts` の `DEFAULT_UI_OVERLAYS`

テンプレート本体は `templates/sceneTemplate.ts` と `templates/uiOverlayTemplate.ts` に格納されています。必要に応じてベースとなる描画を編集してください。

## 操作方法

### 共通操作

- `Space`: フルスクリーン切り替え
- `Enter`: タップテンポ入力（BPMを手動同期）
- `0`〜`9`: UIオーバーレイの切り替え（`src/config/uiConfig.ts`で定義した順序）

### AKAI APC Mini MK2（推奨）

- **フェーダー1〜8**: `DEFAULT_POST_EFFECT_SELECTION`で指定したポストエフェクトを制御
- **フェーダー9**: 常にブラックアウト（`u_blackout`）
- **サイドボタン（1〜8）**: シーン切り替え
- **最下段ランダムボタン**: ランダムシーンモードの切り替え
- **グリッド8×8**: 現在のシーンパラメーターを選択／ランダム化
- **フェーダーボタン**: ランダムフェーダーモードの切り替え（デフォルトでランダム）

### キーボードフォールバック

MIDIデバイスが検出できない場合、自動的にキーボード操作へ切り替わります。ブラウザのコンソールに有効化メッセージが表示されます。

- **シーン切り替え**: `A`〜`K`（左から順に0〜7）、`[`/`]`で前後移動、`L`でランダムモード切替
- **シーン選択Fキー**: `F1`〜`F8`で直接選択、`F9`でランダムモード切替
- **フェーダー**: `Q`〜`O`
	- 通常押下で+0.05、`Shift`同時押しでマイナス0.05
	- `Ctrl`/`Command`同時で微調整（±0.01）
- **グリッド列**: `Z`〜`,`（カンマ）
	- 通常押下で選択行+1、`Shift`でマイナス1
	- `Alt`同時押しでランダムON/OFF

## 設定ファイル

シーン・UI・ポストエフェクトの割り当ては`src/config`配下で完結します。

### シーンライブラリ

- ファイル: `src/config/sceneConfig.ts`
- 編集対象: `DEFAULT_SCENE_LIBRARY`
- 役割: 使用するシーンクラスと順序の管理
- 関数`instantiateScenes()`は配列をインスタンス化して`main.ts`から呼び出されます。

新しいシーンを追加する場合は`src/scenes`にクラスを実装し、`DEFAULT_SCENE_LIBRARY`にクラスを追記してください。

### UIオーバーレイ

- ファイル: `src/config/uiConfig.ts`
- 編集対象: `DEFAULT_UI_OVERLAYS`
- 役割: 数字キーおよびAPCで切り替えるUIオーバーレイの列挙

追加のUIを実装したら`DEFAULT_UI_OVERLAYS`にクラスを追加することで選択可能になります。

### ポストエフェクト

- ファイル: `src/config/postEffectConfig.ts`
- 編集対象: `POST_EFFECT_SELECTION_PLAN.primary`（フェーダー1〜8に割り当てる順序）
- 候補: `POST_EFFECT_POOL`に事前定義済み（必要に応じて追加・改変可能）
- プリセット: `POST_EFFECT_PRESETS`から選択・流用が可能
- 出力値変換: `transform`関数で各フェーダー値（0〜1）をシェーダー向けに変換

利用可能なポストエフェクト例:

- `invert`: 反転トグル
- `mosaic`: モザイク強度
- `noise`: ノイズ／グリッチ
- `tile`: タイル反復
- `cutGlitch`: 水平スライスのグリッチ
- `monochrome`: モノクロ強度
- `colorize`: カラーパレット固定
- `wave`: 波形ワープ
- `vignette`: ビネット暗転
- `chromatic`: 色収差
- `scanline`: スキャンライン
- `posterize`: ポスタライズ
- `glow`: グロウ／簡易ブルーム
- `mirror`: ミラー合成

`ACTIVE_POST_EFFECTS`と`POST_EFFECT_UNIFORMS`は内部で計算され、`main.ts`が参照します。9本目のフェーダーは常にブラックアウトに固定です。

## プロジェクト構成

```
src/
	main.ts                 # エントリーポイント
	config/
		sceneConfig.ts        # シーン一覧とインスタンス化ヘルパー
		uiConfig.ts           # UIオーバーレイ一覧
		postEffectConfig.ts   # ポストエフェクトのプールと選択
	scenes/                 # 各種VJシーン
	ui/                     # UIオーバーレイ
	midi/                   # MIDI&キーボードフォールバック処理
	rhythm/                 # BPM管理
	utils/                  # イージングなど共通関数
public/
	shader/post.frag        # ポストプロセスシェーダー
	shader/post.vert        # 頂点シェーダー
	assets/                 # フォントや画像など
```

## 開発メモ

- MIDI初期化には1秒程度の遅延があります。ブラウザでページ読み込み後、MIDI接続が安定するまで待ってください。
- 画像素材は`public/image/image-1.*`〜`image-10.*`の命名規則で読み込まれます（`PhotoPulseCollageScene`）。
- TypeScriptの型エラーを確認したい場合は`npm run build`が便利です。

## ライセンス

本プロジェクトのライセンスについてはリポジトリのルートにある`LICENSE`（存在する場合）を参照してください。