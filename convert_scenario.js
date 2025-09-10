const fs = require('fs');
const path = require('path');

const BUILT_IN_SCENARIO_PATH = path.join(__dirname, 'chunks', 'scenario');
const SCENARIO_OUTPUT_PATH = path.join(__dirname, 'dist', 'scenario');

/**
 * @param {Object} scenarioJson シナリオオブジェクト
 * @returns {string} markdown
 */
function createScenarioMarkDown(scenarioJson) {
    const scenario = scenarioJson.params[0].value;
    const md = [];

    md.push('---');
    md.push('# ===============');
    md.push('#  シナリオ情報');
    md.push('# ===============');
    md.push(`title: "${scenario.title}"`);
    md.push(`author: "${scenario.author}"`);
    md.push(`recommended_level: "${scenario.recommended_level}"`);
    md.push(`tags: ["${scenario.tags.join('", "')}"]`);
    md.push('');
    md.push('# ===============');
    md.push('#  報酬設定');
    md.push('# ===============');
    md.push(`rewards:`);
    md.push(`  currency: "${scenario.rewards.currency}"`);
    md.push(`  data_cores: ["${scenario.rewards.data_cores.join('", "')}"]`);
    const rewardItems = scenario.rewards.unique_items
    Object.keys(rewardItems).forEach(key => {
        md.push(`  - name: "${rewardItems[key].name}"`);
        md.push(`    description: "${rewardItems[key].description}"`);
    });
    md.push('');
    md.push('# ===============');
    md.push('#  登場NPC・敵');
    md.push('# ===============');
    md.push(`actors:`);
    for (const actor of scenario.actors) {
        md.push(`  - id: "${actor.id}"`);
        md.push(`    name: "${actor.name}"`);
        md.push(`    is_enemy: "${actor.is_enemy}"`);
        md.push(`    archetype: "${actor.archetype}"`);
        if (actor.stats) if (Object.keys(actor.stats).length > 0) {
            let statStr = '';
            Object.keys(actor.stats).forEach(key => {
                statStr += `${actor.stats[key].name}: "${actor.stats[key].value}", `;
            });
            md.push(`    stats: {${statStr.slice(0, -2)}}`);
        }
        if (actor.abilities)
            md.push(`    abilities: ["${actor.abilities.join('", "')}"]`);
        if (actor.remarks)
            md.push(`    remarks: ["${actor.remarks.join('", "')}"]`);
    }
    md.push('');
    md.push('# ===============');
    md.push('#  舞台');
    md.push('# ===============');
    md.push(`locations:`);
    for (const location of scenario.locations) {
        md.push(`  - id: "${location.id}"`);
        md.push(`    name: "${location.name}"`);
        md.push(`    is_alive: "${location.is_alive}"`);
        md.push(`    remarks: ["${location.remarks.join('", "')}"]`);
    }
    md.push('');
    md.push('# ===============');
    md.push('#  キーシーン');
    md.push('# ===============');
    md.push(`scenes:`);
    for (const scene of scenario.key_scenes) {
        md.push(`  - id: "${scene.id}"`);
        md.push(`    name: "${scene.name}"`);
        md.push('    trigger:');
        md.push(`      type: "${scene.trigger.type}"`);
        md.push(`      value: "${scene.trigger.value}"`);
        md.push(`    description: "${scene.description}"`);
        md.push('    event:');
        md.push(`      type: "${scene.event.type}"`);
        md.push(`      encounter: ["${scene.event.encounter.join('", "')}"]`);
        md.push(`      rules:`);
        for (const rule of scene.event.rules) {
            md.push(`        - condition: "${rule.condition}"`);
            md.push(`          judge_id: "${rule.judge_id}"`);
            md.push(`          difficulty: "${rule.difficulty}"`);
            md.push(`          on_success: "${rule.on_success}"`);
            md.push(`          on_failure: "${rule.on_failure}"`);
            md.push(`          on_fumble: "${rule.on_fumble}"`);
        }
        md.push(`    on_complete:`);
        md.push(`      text: "${scene.on_complete.text}"`);
        md.push(`      goto: "${scene.on_complete.goto}"`);
    }
    md.push('');
    md.push('---');
    md.push('');
    md.push(`# ${scenario.title}\n`);
    md.push(`## 導入フェーズ\n`);
    md.push(`${scenario.introduction.join('\n')}\n`);
    md.push(`## 舞台\n`);
    md.push(`${scenario.main_stage.join('\n')}\n`);
    md.push(`## 推奨される進行\n`);
    md.push(`${scenario.supposition.join('\n')}\n`);

    return md.join('\n');
}

function convert() {
    if (!fs.existsSync(SCENARIO_OUTPUT_PATH)) {
        fs.mkdirSync(SCENARIO_OUTPUT_PATH);
    }
    fs.readdirSync(BUILT_IN_SCENARIO_PATH).forEach(file => {
        if (!file.endsWith('.json')) return;
        const scenarioRaw = JSON.parse(fs.readFileSync(path.join(BUILT_IN_SCENARIO_PATH, file)));
        const md = createScenarioMarkDown(scenarioRaw);
        fs.writeFileSync(path.join(SCENARIO_OUTPUT_PATH, file.replace('.json', '.md')), md);
        console.log(`シナリオ：${file}のマークダウンへの変換が完了しました。`);
    });
    console.log('シナリオのマークダウンへの変換が完了しました。');
}

convert();