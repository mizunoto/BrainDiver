---
# ===============
#  シナリオ情報 (AIが読むデータ)
# ===============
title: "落とし物の回収"
author: "癸"
recommended_level: "★☆☆☆☆"
tags: ["探索"]

# ===============
#  報酬設定
# ===============
rewards:
  currency: "500-750"
  data_cores: []
  unique_items:
    - name: ""
      description: ""

# ===============
#  登場NPC・敵
# ===============
actors:
  - id: "taylor"
    name: ["テイラー","アレン"]
    is_enemy: false
    archetype: "strayer"
    stats: {}
    abilities: []
    remarks: []
  - id: "mob"
    name: ["巡回マキナス"]
    is_enemy: true
    archetype: "machinus"
    stats: {}
    abilities: []
    remarks: []
  - id: "boss"
    name: ["狼型マキナス"]
    is_enemy: true
    archetype: "machinus"
    stats: {}
    abilities: []
    remarks: []
locations:
  - id: "power_plant"
    name: "生きた発電所"
    is_alive: true
    remarks: ["マキナスが巡回、警戒している","施設のハッキングに失敗するとマキナスに感づかれる"]
# ===============================
#  キー・シーン (物語の分岐点)
# ===============================
key_scenes:
  - id: "scene_climax_encounter"
    name: "最奥での遭遇"
    trigger:
      type: "location"
      value: "施設の最奥"
    description: "施設の最奥に、目的のロケットが置かれている。しかし、その傍らには人の背丈もある[狼型のマキナス](boss)が休止状態で鎮座している。回避は困難そうだ。"
    event:
      type: "combat"
      encounter: ["boss"]
      rules:
        - condition: "プレイヤーが奇襲を選択した場合"
          judge_id: "ranged_attack_check"
          difficulty: "普通"
          on_success: "敵を1ターン行動妨害状態にする。"
          on_failure: "2ターン目に[巡回マキナス](mob)が増援として登場する。"
          on_fumble: "目標のロケットを破壊してしまう。"
    on_complete:
      text: "激闘の末、君たちは狼型マキナスを無力化し、無事にロケットを手に入れた。"
      goto: "scenario_clear"
---

# ===============================================
#  シナリオ本文 (人間とAIが読む物語)
# ===============================================

## 導入フェーズ

ある日プレイヤーは片足を失った、引退したストレイヤーである[テイラー](taylor)から落とし物の回収を依頼される。
それはかつて自身がストレイヤーだった時に落とした、大切な人の写真の入ったロケットだという。
もうすぐロケットを落とした施設の近くを輪転街が通るので依頼を受けてくれるストレイヤーに片っ端から声をかけているようだ。
- プレイヤーが報酬金の値上げを求めた場合、[交渉判定](negotiate_check)を許可する

## 舞台

**[生きた発電所](location:power_plant):** 今なお稼働を続ける旧時代の発電所。内部は[巡回マキナス](mob)が警備している。施設のハッキングに失敗すると、マキナスに感づかれる可能性がある。

## 推奨される進行

プレイヤーは発電所に侵入する方法を見つける必要がある。例えば、
- **正面ドア:** [レリック・ハック判定](relic_hack_check)（容易）で開けられるが、失敗すると警報が鳴る。
- **側面の崩落:** [罠知識判定](trap_knowledge_check)（普通）で安全なルートを探せる。
- **壁の破壊:** [近接攻撃判定](melee_attack_check)（非常に困難）も可能だが、大きな騒ぎになるだろう。

最終的に、プレイヤーが**「施設の最奥」**に到達した時、シナリオはクライマックスを迎える（`scene_climax_encounter`へ）。