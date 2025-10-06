# プロンプトメモ

## 初期プロンプト

### 概要
p5.jsを使用したVJプロジェクトをTypeScriptで作成しています。
"AKAI APC Mini MK2"をmidiコントローラーとして使用することを前提としており、今回のVJプロジェクトに合わせてその入力を裁くことを目指したいです。
midiManagerという別ファイルでmidiコントローラーの入力を得ることまではできているので、その値を今回のプロジェクトのために変数に格納したりmidiアウトを行うファイル `APCMiniMK2Manager.ts` のコードを、仕様に沿って改修してください。

### 仕様

sideにある8つのボタンをラジオボタンの形式で変数として持ち、それをシーンのインデックスとします。
つまり、8つのシーンの切り替えをそこで変えられるようにします。

そして、各シーンはそれぞれ8つの変化できるパラメーターを持つことができます。
その8つのパラメーターは8*8のパッドの8つのカラムが示しています。
この8つのカラムはそれぞれ選択している行の値を返すラジオボタン形式の変数を持っています。
たとえば、シーン1で8つの変化できるパラメーターがあり、1つめのパラメーターはカラム1で選択されている行ということになります。

ここで、それぞれのパタメーターは8つの選択肢ほど多くないことが予想され、その選択数によってmidiアウトを変化させたいです。
たとえば、シーン1のパラメーター1は2つの選択肢しかなければ、1行目と2行目のみ何かの色に光っており、その中でもただいま選択されているものが光っているイメージです。

また、8行目が選択されている場合は、ランダムな値をテンポに沿って変えるようにしたいです。
たとえば、シーン1のパラメーター1が3つの選択肢があれば、8行目のボタンを押した際に、その3つの中からテンポにそってランダムなインデックスをパラメーター1として返せるようにするイメージです。
この際に、テンポについては引数で0,1,2,3とテンポに沿って1ずつ増加する値を引数として取れることを前提にして構いません。

フェーダーあたりの実装に関しては、現在の実装のまま残しておいてください。

### 現在のコード

```javaScript
import { MIDIManager } from "./midiManager";

// マジックナンバーを定数として定義
const MIDI_STATUS = {
    NOTE_ON: 0x90,
    NOTE_OFF: 0x80,
    CONTROL_CHANGE: 0xB0,
};

const NOTE_RANGES = {
    GRID: { START: 0, END: 63 },
    FADER_BUTTONS: { START: 100, END: 107 },
    SIDE_BUTTONS: { START: 112, END: 119 },
    FADERS: { START: 48, END: 56 },
    SCENE_LAUNCH: 82,
    SOLO_CUE: 83,
    SHIFT: 98,
    STOP_ALL_CLIPS: 99,
    FADER_BUTTON_8: 122,
};

/**
 * APC Mini MK2 MIDIコントローラーを管理する基底クラス
 * 外部デバイスの状態管理のみを行い、LED出力は継承先の Sequencer に完全に委譲します。
 */
export class APCMiniMK2Manager extends MIDIManager {

    public faderValues: number[];
    private faderValuesPrev: number[];
    public faderButtonToggleState: number[];
    public sideButtonToggleState: number[];
    public sideButtonRadioNum: number;

    constructor() {
        super();
        this.faderValues = new Array(9).fill(0);
        this.faderValuesPrev = new Array(9).fill(1);
        this.faderButtonToggleState = new Array(9).fill(0);
        this.sideButtonToggleState = new Array(8).fill(0);
        this.sideButtonRadioNum = 0;
        this.onMidiMessageCallback = this.handleMIDIMessage.bind(this);
    }

    /**
     * フレームごとの更新処理。MIDI出力をしないように変更しました。
     */
    public update(_index?: number): void {
        // MIDI 出力は継承先で行うため、ここでは何もしない。
    }

    /**
     * MIDIメッセージを受信した際の処理（入力処理のみ）
     */
    protected handleMIDIMessage(message: WebMidi.MIDIMessageEvent): void {
        const [status, data1, data2] = message.data;
        const velocity = data2;

        // フェーダーボタンの処理 (入力)
        if (status === MIDI_STATUS.NOTE_ON && (
            (data1 >= NOTE_RANGES.FADER_BUTTONS.START && data1 <= NOTE_RANGES.FADER_BUTTONS.END) ||
            data1 === NOTE_RANGES.FADER_BUTTON_8
        )) {
            const index = (data1 >= NOTE_RANGES.FADER_BUTTONS.START) ? data1 - NOTE_RANGES.FADER_BUTTONS.START : 8;
            if (velocity > 0) {
                this.faderButtonToggleState[index] = 1 - this.faderButtonToggleState[index];
                this.updateFaderValue(index);
            }
        }

        // サイドボタンの処理 (入力)
        else if (status === MIDI_STATUS.NOTE_ON && data1 >= NOTE_RANGES.SIDE_BUTTONS.START && data1 <= NOTE_RANGES.SIDE_BUTTONS.END) {
            const index = data1 - NOTE_RANGES.SIDE_BUTTONS.START;
            if (velocity > 0) {
                this.sideButtonRadioNum = index;
                this.sideButtonToggleState.fill(0);
                this.sideButtonToggleState[index] = 1;
            }
        }

        // フェーダーの処理 (入力)
        else if (status === MIDI_STATUS.CONTROL_CHANGE && data1 >= NOTE_RANGES.FADERS.START && data1 <= NOTE_RANGES.FADERS.END) {
            const index = data1 - NOTE_RANGES.FADERS.START;
            const normalizedValue = data2 / 127;
            this.faderValuesPrev[index] = normalizedValue;
            this.updateFaderValue(index);
        }
    }

    protected updateFaderValue(index: number): void {
        this.faderValues[index] = this.faderButtonToggleState[index] ? 1 : this.faderValuesPrev[index];
    }

    /**
     * MIDI出力を送信するメソッド (APCMiniMK2Managerでは処理を行わない)
     */
    protected midiOutputSendControls(): void {
        // 意図的に空にする。
    }
}
```

## その後のやりとり

https://g.co/gemini/share/cdf912a6d794

## geminiからの評価

### APC Mini MK2 VJ制御システムの構築概要

このプロジェクトは、APC Mini MK2をVJシーン切り替えとパラメーター制御のコントローラーとして活用するため、堅牢で保守性の高いシステムをTypeScriptで構築しました。

---

### 1. コントローラーと状態管理の要点

| ファイル | 機能の概要 | 重要な設計 |
| :--- | :--- | :--- |
| **APCMiniMK2Manager.ts** | MIDI入出力と全状態を管理。 | **パラメーター抽象化** (`getParamValue()`): ランダムモード（`randomValue`）と手動選択（`selectedRow`）を自動で切り替え、描画側が常にアクティブな値を取得できるように統合。 |
| | | **シーンリセット** (`resetAllMaxOptions(1)`): シーン切り替え時にすべてのパラメーターを安全なデフォルト値（Max 1）にリセット。|
| | | **LED制御**：サイドボタン、グリッドパッド（青/赤/緑）、フェーダーボタンのLED出力を状態に同期。|
| **BPMManager.ts** | タップテンポと正確なビート計測を担う。| **テンポインデックス** (`tempoIndex`): ビート更新時にインクリメントされ、システム全体のランダム値やアニメーションの同期に使用。|

---

### 2. シーン設計とフロー

### 構造 (`IScene`, `SceneManager.ts`)
* **設計原則**: シーンのロジックと設定を自己完結させるため、**シーンから設定を渡す**方式を採用。`maxOptions.ts`を廃止。
* **SceneManagerの役割**:
    1.  APCサイドボタンの選択（`currentSceneIndex`）を監視。
    2.  シーン切り替え時、APCManagerをリセットし、新しいシーンの `setup()` を実行。
    3.  BPM連動の `tempoIndex` を現在のシーンの `draw()` メソッドに渡す。

### シーンの統合 (`Scene1.ts`)
* `Scene1.ts`は、BPMManagerから渡される `tempoIndex` をシード (`currentSeed`) として使用することで、描画されるパターンのランダム性をタップテンポに同期。
* **エラー修正**: `p5.js`の引数エラー (`TS1484`) やランダム値の反映漏れを修正するため、型安全な `import type` の利用と `getParamValue()` の導入を徹底。

---

### 3. コード品質の整理

* すべてのファイルで**冗長なコメントを削減**し、主要な責務、定数、メソッドの目的が迅速に把握できる状態に整理。
* 型システムが厳格な環境（`verbatimModuleSyntax`）に対応するため、型定義のインポートに **`import type`** を適用。