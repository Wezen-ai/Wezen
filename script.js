// 전역 변수들
let simulationChart = null;
let currentSimulationData = [];
let currentSensitivityData = [];
const presets = JSON.parse(localStorage.getItem('damagePresets')) || [];

// DOM 요소들
document.addEventListener('DOMContentLoaded', function() {
    // 계산 버튼 이벤트 리스너
    document.getElementById('calculateBtn').addEventListener('click', calculateDamage);
    
    // 초기화 버튼 이벤트 리스너
    document.getElementById('resetBtn').addEventListener('click', resetStats);
    
    // 시뮬레이션 실행 버튼 이벤트 리스너
    document.getElementById('runSimulationBtn').addEventListener('click', runSimulation);
    
    // 민감도 분석 버튼 이벤트 리스너
    document.getElementById('showSensitivityBtn').addEventListener('click', showSensitivitySettings);
    
    // 민감도 분석 설정 버튼 이벤트 리스너
    document.getElementById('runSensitivityBtn').addEventListener('click', runSensitivityAnalysis);
    document.getElementById('resetSensitivitySettingsBtn').addEventListener('click', resetSensitivitySettings);
    
    // 프리셋 관련 이벤트 리스너
    document.getElementById('savePresetBtn').addEventListener('click', saveCurrentAsPreset);
    document.getElementById('loadPresetBtn').addEventListener('click', openPresetModal);
    document.getElementById('saveNewPresetBtn').addEventListener('click', saveNewPreset);
    
    // 모달 닫기 이벤트 리스너
    document.querySelector('.close').addEventListener('click', closePresetModal);
    
    // 데이터 내보내기 버튼 이벤트 리스너
    document.getElementById('exportChartBtn').addEventListener('click', exportChartAsImage);
    document.getElementById('exportDataBtn').addEventListener('click', exportDataAsCSV);
    
    // 적 레벨 변경 이벤트 리스너
    document.getElementById('enemyLevel').addEventListener('input', updateEnemyDefense);
    
    // 차트 초기화
    const ctx = document.getElementById('simulationChart').getContext('2d');
    simulationChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '대미지',
                data: [],
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderWidth: 2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '스탯 값'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '대미지'
                    }
                }
            }
        }
    });
    
    // 프리셋 목록 로드
    loadPresets();
    
    // 적 방어력 초기화
    updateEnemyDefense();
    
    // 초기 대미지 계산
    calculateDamage();
});

// 적 방어력 자동 계산 함수
function updateEnemyDefense() {
    const enemyLevel = Number(document.getElementById('enemyLevel').value);
    const enemyDefense = 792 + (8 * enemyLevel);
    document.getElementById('enemyDefense').value = enemyDefense;
}

// 대미지 계산 함수
function calculateDamage() {
    // 모든 필요한 스탯 가져오기
    const stats = getAllStats();
    
    // 각 파라미터 계산
    const finalAttack = calculateFinalAttack(stats);
    const totalSkillCoef = calculateTotalSkillCoef(stats);
    const totalDamageBonus = calculateTotalDamageBonus(stats);
    const totalDamageBoost = calculateTotalDamageBoost(stats);
    const critExpectedValue = calculateCritExpectedValue(stats);
    const enemyDefenseRate = calculateEnemyDefenseRate(stats);
    const enemyResistanceRate = calculateEnemyResistanceRate(stats);
    
    // 최종 대미지 계산
    const finalDamage = finalAttack * totalSkillCoef * totalDamageBonus * 
                        totalDamageBoost * critExpectedValue * 
                        enemyDefenseRate * enemyResistanceRate;
    
    // 결과 업데이트
    updateResults(finalDamage, {
        finalAttack,
        totalSkillCoef,
        totalDamageBonus,
        totalDamageBoost,
        critExpectedValue,
        enemyDefenseRate,
        enemyResistanceRate
    });
    
    return finalDamage;
}

// 모든 스탯 수집 함수
function getAllStats() {
    return {
        characterAttack: Number(document.getElementById('characterAttack').value),
        weaponAttack: Number(document.getElementById('weaponAttack').value),
        attackPercentage: Number(document.getElementById('attackPercentage').value) / 100,
        fixedAttack: Number(document.getElementById('fixedAttack').value),
        
        baseSkillRatio: Number(document.getElementById('baseSkillRatio').value) / 100,
        additionalRatio: Number(document.getElementById('additionalRatio').value) / 100,
        
        damageBonus: Number(document.getElementById('damageBonus').value) / 100,
        elementDamageBonus: Number(document.getElementById('elementDamageBonus').value) / 100,
        attackTypeDamageBonus: Number(document.getElementById('attackTypeDamageBonus').value) / 100,
        
        damageBoost: Number(document.getElementById('damageBoost').value) / 100,
        elementDamageBoost: Number(document.getElementById('elementDamageBoost').value) / 100,
        attackTypeDamageBoost: Number(document.getElementById('attackTypeDamageBoost').value) / 100,
        
        critRate: Number(document.getElementById('critRate').value) / 100,
        critDamage: Number(document.getElementById('critDamage').value) / 100,
        
        enemyLevel: Number(document.getElementById('enemyLevel').value),
        enemyDefense: Number(document.getElementById('enemyDefense').value),
        defenseIgnore: Number(document.getElementById('defenseIgnore').value) / 100,
        characterLevel: Number(document.getElementById('characterLevel').value),
        
        enemyResistance: Number(document.getElementById('enemyResistance').value) / 100,
        resistanceReduction: Number(document.getElementById('resistanceReduction').value) / 100
    };
}

// 최종 공격력 계산
function calculateFinalAttack(stats) {
    return (stats.characterAttack + stats.weaponAttack) * 
           (1 + stats.attackPercentage) + 
           stats.fixedAttack;
}

// 총 스킬 계수 계산
function calculateTotalSkillCoef(stats) {
    return stats.baseSkillRatio * (1 + stats.additionalRatio);
}

// 총 피해 보너스 계산
function calculateTotalDamageBonus(stats) {
    return 1 + stats.damageBonus + 
           stats.elementDamageBonus + 
           stats.attackTypeDamageBonus;
}

// 총 피해 부스트 계산
function calculateTotalDamageBoost(stats) {
    return 1 + stats.damageBoost + 
           stats.elementDamageBoost + 
           stats.attackTypeDamageBoost;
}

// 크리티컬 기댓값 계산
function calculateCritExpectedValue(stats) {
    return (stats.critRate * stats.critDamage) + (1 - stats.critRate);
}

// 적 방어율 계산
function calculateEnemyDefenseRate(stats) {
    const effectiveDefense = stats.enemyDefense * (1 - stats.defenseIgnore);
    const denominator = effectiveDefense + 800 + (8 * stats.characterLevel);
    return 1 - (effectiveDefense / denominator);
}

// 적 저항률 계산
function calculateEnemyResistanceRate(stats) {
    const effectiveResistance = stats.enemyResistance - stats.resistanceReduction;
    
    if (effectiveResistance >= 0 && effectiveResistance <= 0.8) {
        return 1 - effectiveResistance;
    } else if (effectiveResistance < 0) {
        return 1 - (effectiveResistance / 2);
    } else { // 저항 > 80%
        return 1 / (1 + (5 * effectiveResistance));
    }
}

// 결과 UI 업데이트
function updateResults(finalDamage, parameters) {
    // 최종 대미지 업데이트
    document.getElementById('finalDamage').textContent = finalDamage.toFixed(2);
    
    // 파라미터 결과 업데이트
    document.getElementById('finalAttackResult').textContent = parameters.finalAttack.toFixed(2);
    document.getElementById('totalSkillCoefResult').textContent = parameters.totalSkillCoef.toFixed(2);
    document.getElementById('critExpectedValueResult').textContent = parameters.critExpectedValue.toFixed(2);
    document.getElementById('totalDamageBonusResult').textContent = parameters.totalDamageBonus.toFixed(2);
    document.getElementById('totalDamageBoostResult').textContent = parameters.totalDamageBoost.toFixed(2);
    document.getElementById('enemyDefenseRateResult').textContent = parameters.enemyDefenseRate.toFixed(2);
    document.getElementById('enemyResistanceRateResult').textContent = parameters.enemyResistanceRate.toFixed(2);
}

// 스탯 초기화
function resetStats() {
    // 모든 입력 필드 기본값으로 리셋
    document.getElementById('characterAttack').value = 100;
    document.getElementById('weaponAttack').value = 50;
    document.getElementById('attackPercentage').value = 20;
    document.getElementById('fixedAttack').value = 30;
    
    document.getElementById('baseSkillRatio').value = 150;
    document.getElementById('additionalRatio').value = 30;
    
    document.getElementById('damageBonus').value = 15;
    document.getElementById('elementDamageBonus').value = 10;
    document.getElementById('attackTypeDamageBonus').value = 5;
    
    document.getElementById('damageBoost').value = 20;
    document.getElementById('elementDamageBoost').value = 15;
    document.getElementById('attackTypeDamageBoost').value = 10;
    
    document.getElementById('critRate').value = 30;
    document.getElementById('critDamage').value = 50;
    
    document.getElementById('enemyLevel').value = 50;
    // 적 방어력 자동 계산
    updateEnemyDefense();
    document.getElementById('defenseIgnore').value = 20;
    document.getElementById('characterLevel').value = 50;
    
    document.getElementById('enemyResistance').value = 20;
    document.getElementById('resistanceReduction').value = 10;
    
    // 대미지 계산
    calculateDamage();
}

// 시뮬레이션 실행
function runSimulation() {
    const statToSimulate = document.getElementById('simulationStat').value;
    const minValue = Number(document.getElementById('simMinValue').value);
    const maxValue = Number(document.getElementById('simMaxValue').value);
    const stepValue = Number(document.getElementById('simStepValue').value);
    
    if (minValue >= maxValue) {
        alert('최대값은 최소값보다 커야 합니다.');
        return;
    }
    
    if (stepValue <= 0) {
        alert('증가 단위는 0보다 커야 합니다.');
        return;
    }
    
    // 민감도 분석 결과 숨기기
    document.getElementById('sensitivitySection').style.display = 'none';
    
    // 현재 스탯 상태 저장
    const baseStats = getAllStats();
    // 원래 입력된 값 (100으로 나누기 전) 저장
    const baseStatValue = Number(document.getElementById(statToSimulate).value);
    
    // 시뮬레이션 데이터 준비
    const labels = [];
    const damageValues = [];
    
    // 각 스탯 값에 대한 대미지 계산
    for (let value = minValue; value <= maxValue; value += stepValue) {
        // 해당 스탯만 변경
        document.getElementById(statToSimulate).value = value;
        
        // 적 레벨이 변수인 경우 적 방어력 업데이트
        if (statToSimulate === 'enemyLevel') {
            updateEnemyDefense();
        }
        
        // 대미지 계산
        const damage = calculateDamage();
        
        // 결과 저장
        labels.push(value);
        damageValues.push(damage);
    }
    
    // 원래 스탯 값으로 복원
    document.getElementById(statToSimulate).value = baseStatValue;
    
    // 적 레벨이 변수인 경우 적 방어력도 복원
    if (statToSimulate === 'enemyLevel') {
        updateEnemyDefense();
    }
    
    calculateDamage();
    
    // 시뮬레이션 결과 저장
    currentSimulationData = labels.map((statValue, index) => {
        return {
            statValue,
            damage: damageValues[index]
        };
    });
    
    // 차트 업데이트
    updateSimulationChart(labels, damageValues, statToSimulate);
}

// 시뮬레이션 차트 업데이트
function updateSimulationChart(labels, damageValues, statName) {
    // 스탯 이름을 사용자 친화적으로 변환
    const statDisplayNames = {
        // 최종 공격력 관련
        characterAttack: '캐릭터 공격력',
        weaponAttack: '무기 공격력',
        attackPercentage: '공격력%',
        fixedAttack: '고정 공격력',
        
        // 총 스킬 배율 관련
        baseSkillRatio: '기본 스킬 배율%',
        additionalRatio: '추가 배율%',
        
        // 크리티컬 관련
        critRate: '크리티컬 확률%',
        critDamage: '크리티컬 피해%',
        
        // 총 피해 보너스 관련
        damageBonus: '피해 보너스%',
        elementDamageBonus: '속성 피해 보너스%',
        attackTypeDamageBonus: '공격 타입 피해 보너스%',
        
        // 총 피해 부스트 관련
        damageBoost: '피해 부스트%',
        elementDamageBoost: '속성 피해 부스트%',
        attackTypeDamageBoost: '공격 타입 피해 부스트%',
        
        // 적 방어율 관련
        enemyLevel: '적 레벨',
        defenseIgnore: '방어 무시율%',
        characterLevel: '캐릭터 레벨',
        
        // 적 저항률 관련
        enemyResistance: '적 저항%',
        resistanceReduction: '저항 감소율%'
    };
    
    const displayName = statDisplayNames[statName] || statName;
    
    // 차트 데이터 업데이트
    simulationChart.data.labels = labels;
    simulationChart.data.datasets[0].data = damageValues;
    simulationChart.data.datasets[0].label = `${displayName}에 따른 대미지`;
    
    // X축 제목 업데이트
    simulationChart.options.scales.x.title.text = displayName;
    
    // 차트 업데이트
    simulationChart.update();
}

// 현재 상태를 프리셋으로 저장
function saveCurrentAsPreset() {
    const presetName = prompt('저장할 프리셋 이름을 입력하세요:');
    if (!presetName) return;
    
    const stats = getAllStats();
    const newPreset = {
        id: Date.now().toString(),
        name: presetName,
        description: '',
        stats,
        createdAt: new Date().toISOString()
    };
    
    presets.push(newPreset);
    localStorage.setItem('damagePresets', JSON.stringify(presets));
    
    loadPresets();
    alert(`프리셋 '${presetName}'이(가) 저장되었습니다.`);
}

// 새 프리셋 저장 (설명 포함)
function saveNewPreset() {
    const presetName = document.getElementById('presetName').value.trim();
    const presetDescription = document.getElementById('presetDescription').value.trim();
    
    if (!presetName) {
        alert('프리셋 이름을 입력해주세요.');
        return;
    }
    
    const stats = getAllStats();
    const newPreset = {
        id: Date.now().toString(),
        name: presetName,
        description: presetDescription,
        stats,
        createdAt: new Date().toISOString()
    };
    
    presets.push(newPreset);
    localStorage.setItem('damagePresets', JSON.stringify(presets));
    
    // 입력 필드 초기화
    document.getElementById('presetName').value = '';
    document.getElementById('presetDescription').value = '';
    
    loadPresets();
    alert(`프리셋 '${presetName}'이(가) 저장되었습니다.`);
}

// 프리셋 목록 불러오기
function loadPresets() {
    const container = document.getElementById('presetsContainer');
    const presetList = document.getElementById('presetList');
    
    // 컨테이너 초기화
    container.innerHTML = '';
    presetList.innerHTML = '';
    
    if (presets.length === 0) {
        container.innerHTML = '<p class="empty-state">저장된 프리셋이 없습니다</p>';
        return;
    }
    
    // 프리셋 카드 생성
    presets.forEach(preset => {
        // 메인 컨테이너용 카드
        const card = document.createElement('div');
        card.className = 'preset-card';
        card.innerHTML = `
            <h3>${preset.name}</h3>
            <p>${preset.description || '설명 없음'}</p>
            <div class="preset-actions">
                <button class="secondary-btn load-preset-btn" data-id="${preset.id}">불러오기</button>
                <button class="secondary-btn delete-preset-btn" data-id="${preset.id}">삭제</button>
            </div>
        `;
        container.appendChild(card);
        
        // 이벤트 리스너 추가
        card.querySelector('.load-preset-btn').addEventListener('click', () => loadPreset(preset.id));
        card.querySelector('.delete-preset-btn').addEventListener('click', () => deletePreset(preset.id));
        
        // 모달용 아이템
        const item = document.createElement('div');
        item.className = 'preset-item';
        item.textContent = preset.name;
        item.dataset.id = preset.id;
        item.addEventListener('click', () => {
            loadPreset(preset.id);
            closePresetModal();
        });
        presetList.appendChild(item);
    });
}

// 프리셋 불러오기
function loadPreset(presetId) {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;
    
    // 모든 스탯 값 설정
    const stats = preset.stats;
    
    // 백분율 값을 가진 필드들
    const percentFields = [
        'attackPercentage', 'baseSkillRatio', 'additionalRatio',
        'damageBonus', 'elementDamageBonus', 'attackTypeDamageBonus',
        'damageBoost', 'elementDamageBoost', 'attackTypeDamageBoost',
        'critRate', 'critDamage', 'defenseIgnore',
        'enemyResistance', 'resistanceReduction'
    ];
    
    for (const [key, value] of Object.entries(stats)) {
        const input = document.getElementById(key);
        if (input) {
            // 백분율 필드의 경우 100을 곱해서 표시
            if (percentFields.includes(key)) {
                input.value = (value * 100).toFixed(2);
            } else {
            input.value = value;
            }
        }
    }
    
    // 적 레벨에 따라 적 방어력 업데이트
    updateEnemyDefense();
    
    // 대미지 다시 계산
    calculateDamage();
    alert(`프리셋 '${preset.name}'을(를) 불러왔습니다.`);
}

// 프리셋 삭제
function deletePreset(presetId) {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;
    
    if (confirm(`프리셋 '${preset.name}'을(를) 삭제하시겠습니까?`)) {
        const index = presets.findIndex(p => p.id === presetId);
        presets.splice(index, 1);
        localStorage.setItem('damagePresets', JSON.stringify(presets));
        loadPresets();
    }
}

// 프리셋 모달 열기
function openPresetModal() {
    const modal = document.getElementById('presetModal');
    modal.style.display = 'block';
}

// 프리셋 모달 닫기
function closePresetModal() {
    const modal = document.getElementById('presetModal');
    modal.style.display = 'none';
}

// 차트를 이미지로 내보내기
function exportChartAsImage() {
    if (!simulationChart) return;
    
    const canvas = document.getElementById('simulationChart');
    const image = canvas.toDataURL('image/png');
    
    const link = document.createElement('a');
    link.download = `damage-simulation-${Date.now()}.png`;
    link.href = image;
    link.click();
}

// 시뮬레이션 데이터를 CSV로 내보내기
function exportDataAsCSV() {
    if (currentSimulationData.length === 0) {
        alert('내보낼 시뮬레이션 데이터가 없습니다. 먼저 시뮬레이션을 실행해주세요.');
        return;
    }
    
    // CSV 헤더 및 내용 생성
    let csv = '스탯값,대미지\n';
    currentSimulationData.forEach(item => {
        csv += `${item.statValue},${item.damage}\n`;
    });
    
    // CSV 다운로드
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `damage-data-${Date.now()}.csv`;
    link.click();
}

// 민감도 분석 설정 화면 표시
function showSensitivitySettings() {
    // 민감도 분석 설정 섹션 표시
    document.getElementById('sensitivitySettingsSection').style.display = 'block';
    // 민감도 분석 결과 섹션 숨기기
    document.getElementById('sensitivitySection').style.display = 'none';
}

// 민감도 분석 설정 초기화
function resetSensitivitySettings() {
    // 캐릭터 스탯 초기화
    document.getElementById('charAtkInc').value = 100;
    document.getElementById('weaponAtkInc').value = 100;
    document.getElementById('atkPctInc').value = 5;
    document.getElementById('fixedAtkInc').value = 100;
    document.getElementById('charLevelInc').value = 1;
    
    // 스킬 계수 초기화
    document.getElementById('skillRatioInc').value = 10;
    document.getElementById('additionalRatioInc').value = 10;
    
    // 크리티컬 스탯 초기화
    document.getElementById('critRateInc').value = 5;
    document.getElementById('critDmgInc').value = 10;
    
    // 대미지 보너스 초기화
    document.getElementById('dmgBonusInc').value = 5;
    document.getElementById('elemBonusInc').value = 5;
    document.getElementById('atkTypeBonusInc').value = 5;
    
    // 대미지 부스트 초기화
    document.getElementById('dmgBoostInc').value = 5;
    document.getElementById('elemBoostInc').value = 5;
    document.getElementById('atkTypeBoostInc').value = 5;
    
    // 적 방어율 초기화
    document.getElementById('defIgnoreInc').value = 5;
    document.getElementById('enemyLevelInc').value = 1;
    
    // 적 저항률 초기화
    document.getElementById('enemyResInc').value = 5;
    document.getElementById('resReductionInc').value = 5;
}

// 사용자 설정 증가량 가져오기
function getSensitivityIncrements() {
    return {
        // 캐릭터 스탯
        characterAttack: Number(document.getElementById('charAtkInc').value),
        weaponAttack: Number(document.getElementById('weaponAtkInc').value),
        attackPercentage: Number(document.getElementById('atkPctInc').value),
        fixedAttack: Number(document.getElementById('fixedAtkInc').value),
        characterLevel: Number(document.getElementById('charLevelInc').value),
        
        // 스킬 계수
        baseSkillRatio: Number(document.getElementById('skillRatioInc').value),
        additionalRatio: Number(document.getElementById('additionalRatioInc').value),
        
        // 크리티컬 스탯
        critRate: Number(document.getElementById('critRateInc').value),
        critDamage: Number(document.getElementById('critDmgInc').value),
        
        // 대미지 보너스
        damageBonus: Number(document.getElementById('dmgBonusInc').value),
        elementDamageBonus: Number(document.getElementById('elemBonusInc').value),
        attackTypeDamageBonus: Number(document.getElementById('atkTypeBonusInc').value),
        
        // 대미지 부스트
        damageBoost: Number(document.getElementById('dmgBoostInc').value),
        elementDamageBoost: Number(document.getElementById('elemBoostInc').value),
        attackTypeDamageBoost: Number(document.getElementById('atkTypeBoostInc').value),
        
        // 적 방어율
        defenseIgnore: Number(document.getElementById('defIgnoreInc').value),
        enemyLevel: Number(document.getElementById('enemyLevelInc').value),
        
        // 적 저항률
        enemyResistance: Number(document.getElementById('enemyResInc').value),
        resistanceReduction: Number(document.getElementById('resReductionInc').value)
    };
}

// 민감도 분석 함수 구현
function runSensitivityAnalysis() {
    // 민감도 분석 설정 섹션 숨기기
    document.getElementById('sensitivitySettingsSection').style.display = 'none';
    
    // 현재 스탯 값들 가져오기
    const stats = getAllStats();
    
    // 사용자 설정 증가량 가져오기
    const increments = getSensitivityIncrements();
    
    // 기본 대미지 계산 (비교 기준)
    const baseDamage = calculateDamage();
    
    // 분석할 스탯 그룹 정의
    const statGroups = {
        "캐릭터 스탯": [
            { name: "캐릭터 공격력", key: "characterAttack", increment: increments.characterAttack },
            { name: "무기 공격력", key: "weaponAttack", increment: increments.weaponAttack },
            { name: "공격력 증가율 (%)", key: "attackPercentage", increment: increments.attackPercentage },
            { name: "고정 공격력", key: "fixedAttack", increment: increments.fixedAttack },
            { name: "캐릭터 레벨", key: "characterLevel", increment: increments.characterLevel }
        ],
        "스킬 계수": [
            { name: "기본 스킬 배율 (%)", key: "baseSkillRatio", increment: increments.baseSkillRatio },
            { name: "추가 배율 (%)", key: "additionalRatio", increment: increments.additionalRatio }
        ],
        "크리티컬 스탯": [
            { name: "크리티컬 확률 (%)", key: "critRate", increment: increments.critRate },
            { name: "크리티컬 대미지 (%)", key: "critDamage", increment: increments.critDamage }
        ],
        "대미지 보너스": [
            { name: "피해 보너스 (%)", key: "damageBonus", increment: increments.damageBonus },
            { name: "속성 피해 보너스 (%)", key: "elementDamageBonus", increment: increments.elementDamageBonus },
            { name: "공격 타입 피해 보너스 (%)", key: "attackTypeDamageBonus", increment: increments.attackTypeDamageBonus }
        ],
        "대미지 부스트": [
            { name: "피해 부스트 (%)", key: "damageBoost", increment: increments.damageBoost },
            { name: "속성 피해 부스트 (%)", key: "elementDamageBoost", increment: increments.elementDamageBoost },
            { name: "공격 타입 피해 부스트 (%)", key: "attackTypeDamageBoost", increment: increments.attackTypeDamageBoost }
        ],
        "적 방어율": [
            { name: "방어 무시율 (%)", key: "defenseIgnore", increment: increments.defenseIgnore },
            { name: "적 레벨", key: "enemyLevel", increment: increments.enemyLevel }
        ],
        "적 저항률": [
            { name: "적 저항 (%)", key: "enemyResistance", increment: increments.enemyResistance },
            { name: "저항 감소율 (%)", key: "resistanceReduction", increment: increments.resistanceReduction }
        ]
    };

    // 결과 표시 영역 초기화
    const resultsContainer = document.getElementById('sensitivityResults');
    resultsContainer.innerHTML = '';
    
    // 헤더 추가
    const headerRow = document.createElement('div');
    headerRow.className = 'result-header';
    headerRow.innerHTML = `
        <span>스탯</span>
        <span>현재 값</span>
        <span>증가량</span>
        <span>새 대미지</span>
        <span>변화율 (%)</span>
        <span>영향도</span>
    `;
    resultsContainer.appendChild(headerRow);
    
    // 민감도 결과 저장
    currentSensitivityData = [];
    
    // 각 그룹별로 분석 및 결과 추가
    for (const [groupName, statsList] of Object.entries(statGroups)) {
        // 그룹 헤더 추가
        const groupHeader = document.createElement('div');
        groupHeader.className = 'stat-group-header';
        groupHeader.textContent = groupName;
        resultsContainer.appendChild(groupHeader);
        
        statsList.forEach(statInfo => {
            const { name, key, increment } = statInfo;
            
            // 현재 스탯 값 가져오기
            let currentValue = stats[key];
            
            // 원래 값 저장
            const originalValue = document.getElementById(key).value;
            
            // 새로운 스탯 값 설정
            let newValue = Number(originalValue) + increment;
            document.getElementById(key).value = newValue;
            
            // 적 레벨이 변경되면 적 방어력도 업데이트
            if (key === 'enemyLevel') {
                updateEnemyDefense();
            }
            
            // 새 대미지 계산
            const newDamage = calculateDamage();
            
            // 변화율 계산
            let changePercent;
            let impactClass;
            
            // 적 스탯의 경우 부호를 유지하되 양수로 표시 (값이 증가하면 대미지가 감소하므로)
            if (key === 'enemyLevel' || key === 'enemyResistance') {
                changePercent = ((baseDamage - newDamage) / baseDamage * 100).toFixed(2);
                
                // 변화량의 절대값으로 영향도 클래스 결정
                const absChange = Math.abs(parseFloat(changePercent));
                if (absChange > 5) impactClass = 'high-impact';
                else if (absChange > 2) impactClass = 'medium-impact';
                else impactClass = 'low-impact';
            } else {
                changePercent = ((newDamage - baseDamage) / baseDamage * 100).toFixed(2);
                
                // 영향도 클래스 결정
                if (parseFloat(changePercent) > 5) impactClass = 'high-impact';
                else if (parseFloat(changePercent) > 2) impactClass = 'medium-impact';
                else impactClass = 'low-impact';
            }
            
            // 결과 행 생성
            const resultRow = document.createElement('div');
            resultRow.className = 'result-row';
            resultRow.innerHTML = `
                <span>${name}</span>
                <span>${originalValue}</span>
                <span>+${increment}</span>
                <span>${Math.floor(newDamage).toLocaleString()}</span>
                <span class="${impactClass}">${changePercent}%</span>
                <span class="impact-level ${impactClass}"></span>
            `;
            
            resultsContainer.appendChild(resultRow);
            
            // 민감도 데이터 저장
            currentSensitivityData.push({
                group: groupName,
                name: name,
                originalValue: originalValue,
                increment: increment,
                newDamage: newDamage,
                changePercent: changePercent,
                impact: impactClass
            });
            
            // 원래 값으로 복원
            document.getElementById(key).value = originalValue;
            
            // 적 레벨이 변경되었으면 적 방어력도 복원
            if (key === 'enemyLevel') {
                updateEnemyDefense();
            }
        });
    }
    
    // 최종 대미지 재계산 (원래 상태로 복원)
    calculateDamage();
    
    // 결론 생성 버튼 추가
    const conclusionButtonContainer = document.createElement('div');
    conclusionButtonContainer.className = 'action-buttons';
    conclusionButtonContainer.style.marginTop = '20px';
    conclusionButtonContainer.innerHTML = `
        <button id="showConclusionButton" onclick="showConclusion()">결론 보기</button>
    `;
    resultsContainer.appendChild(conclusionButtonContainer);
    
    // 민감도 결과 섹션 표시
    document.getElementById('sensitivitySection').style.display = 'block';
}

// 민감도 분석 결론 표시 함수
function showConclusion() {
    // 결론 섹션이 이미 존재하는지 확인
    let conclusionSection = document.getElementById('conclusionSection');
    
    // 없으면 새로 생성
    if (!conclusionSection) {
        conclusionSection = document.createElement('div');
        conclusionSection.id = 'conclusionSection';
        conclusionSection.className = 'conclusion-section';
        document.getElementById('sensitivitySection').appendChild(conclusionSection);
    }
    
    // 결론 내용 초기화
    conclusionSection.innerHTML = '';
    
    // 데이터가 없으면 중단
    if (!currentSensitivityData || currentSensitivityData.length === 0) {
        conclusionSection.innerHTML = '<p>분석 결과가 없습니다.</p>';
        return;
    }
    
    // 영향도가 높은 순으로 정렬
    const sortedData = [...currentSensitivityData].sort((a, b) => {
        const impactValues = { 'high-impact': 3, 'medium-impact': 2, 'low-impact': 1 };
        const absChangeA = Math.abs(parseFloat(a.changePercent));
        const absChangeB = Math.abs(parseFloat(b.changePercent));
        return absChangeB - absChangeA;
    });
    
    // 상위 5개 추출
    const topStats = sortedData.slice(0, 5);
    
    // 결론 헤더 추가
    const conclusionHeader = document.createElement('h3');
    conclusionHeader.textContent = '민감도 분석 결론';
    conclusionSection.appendChild(conclusionHeader);
    
    // 결론 설명 추가
    const conclusionDesc = document.createElement('p');
    conclusionDesc.textContent = '대미지에 가장 큰 영향을 미치는 상위 5개 스탯입니다. 투자 우선순위를 결정할 때 참고하세요.';
    conclusionSection.appendChild(conclusionDesc);
    
    // 결론 리스트 추가
    const conclusionList = document.createElement('ol');
    conclusionList.className = 'conclusion-list';
    
    topStats.forEach(stat => {
        const listItem = document.createElement('li');
        const isNegative = parseFloat(stat.changePercent) < 0;
        
        if (stat.group === '적 방어율' || stat.group === '적 저항률') {
            // 적 스탯은 감소가 유리함을 표시
            listItem.innerHTML = `
                <span class="${stat.impact}">${stat.name}</span>: 
                <span class="${stat.impact}">${stat.changePercent}%</span> 
                ${isNegative ? '감소' : '증가'} 
                (${stat.group})
                ${stat.name === '적 레벨' || stat.name === '적 방어력' || stat.name === '적 저항 (%)' ? 
                    ' - <strong>감소시키는 것이 유리</strong>' : ''}
            `;
        } else {
            listItem.innerHTML = `
                <span class="${stat.impact}">${stat.name}</span>: 
                <span class="${stat.impact}">${stat.changePercent}%</span> 
                ${isNegative ? '감소' : '증가'} 
                (${stat.group})
            `;
        }
        
        conclusionList.appendChild(listItem);
    });
    
    conclusionSection.appendChild(conclusionList);
    
    // 종합 조언 추가
    const advice = document.createElement('div');
    advice.className = 'conclusion-advice';
    
    // 높은 영향도를 가진 스탯을 기반으로 조언 생성
    const highImpactStats = topStats.filter(stat => stat.impact === 'high-impact');
    let adviceText = '';
    
    if (highImpactStats.length > 0) {
        adviceText += '<p><strong>최우선 투자 스탯:</strong> ';
        adviceText += highImpactStats
            .filter(stat => !(stat.name.includes('적') && (stat.name.includes('레벨') || stat.name.includes('방어') || stat.name.includes('저항'))))
            .map(stat => `<span class="high-impact">${stat.name}</span>`)
            .join(', ');
        adviceText += '</p>';
    }
    
    // 적 스탯에 대한 조언 추가
    const enemyStats = topStats.filter(stat => 
        (stat.group === '적 방어율' || stat.group === '적 저항률') && 
        (stat.name.includes('레벨') || stat.name.includes('방어') || stat.name.includes('저항'))
    );
    
    if (enemyStats.length > 0) {
        adviceText += '<p><strong>주의할 적 특성:</strong> ';
        adviceText += enemyStats
            .map(stat => `<span class="${stat.impact}">${stat.name}</span>`)
            .join(', ');
        adviceText += ' - 이러한 적 특성이 높은 상대는 피하거나 저항/방어 감소 효과를 사용하는 것이 좋습니다.</p>';
    }
    
    advice.innerHTML = adviceText;
    conclusionSection.appendChild(advice);
    
    // 결론 섹션 표시
    conclusionSection.style.display = 'block';
}