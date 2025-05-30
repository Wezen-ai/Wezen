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
    
    // 모달 닫기 이벤트 리스너 - 전역 문서에 이벤트 위임 사용
    document.addEventListener('click', function(e) {
        // 만약 클릭된 요소나 그 부모가 .close 클래스를 가지고 있다면
        if (e.target.matches('.close') || e.target.closest('.close') || e.target.textContent === '×' || e.target.textContent === 'X') {
            closePresetModal();
        }
    });
    
    // 모달 외부 클릭 시 닫기 기능 추가
    const modal = document.getElementById('presetModal');
    modal.addEventListener('click', function(e) {
        // 클릭이 모달 콘텐츠가 아닌 모달 배경에서 발생한 경우에만 닫기
        if (e.target === modal) {
            closePresetModal();
        }
    });
    
    // 데이터 내보내기 버튼 이벤트 리스너
    document.getElementById('exportChartBtn').addEventListener('click', exportChartAsImage);
    document.getElementById('exportDataBtn').addEventListener('click', exportDataAsCSV);
    
    // 적 레벨 변경 이벤트 리스너
    document.getElementById('enemyLevel').addEventListener('input', updateEnemyDefense);
    
    // 차트 초기화
    initializeChart();
    
    // 프리셋 목록 로드
    loadPresets();
    
    // 초기 스탯값 설정 및 대미지 계산
    resetStats();
    
    // 민감도 분석 설정 초기화 (알림 없이)
    resetSensitivitySettings(false);
    
    // 페이지 로드 시 적 저항 입력 필드 숨기기
    const enemyResistanceField = document.querySelector('[for="enemyResistanceInc"]');
    if (enemyResistanceField) {
        const parentElement = enemyResistanceField.parentElement;
        if (parentElement) {
            parentElement.style.display = 'none';
        }
    }
});

// 차트 초기화 함수
function initializeChart() {
    // Chart.js 전역 설정
    Chart.defaults.font.family = "'Pretendard', 'Noto Sans KR', sans-serif";
    Chart.defaults.font.size = 13;
    Chart.defaults.color = '#495057';
    Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(33, 37, 41, 0.9)';
    Chart.defaults.plugins.tooltip.titleFont = { weight: 'bold' };
    Chart.defaults.plugins.tooltip.bodyFont = { size: 13 };
    Chart.defaults.plugins.tooltip.padding = 12;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
    
    const ctx = document.getElementById('simulationChart').getContext('2d');
    
    // 그라디언트 배경 생성
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(67, 97, 238, 0.25)');
    gradient.addColorStop(1, 'rgba(67, 97, 238, 0.02)');
    
    simulationChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '대미지',
                data: [],
                borderColor: '#4361ee',
                backgroundColor: gradient,
                borderWidth: 3,
                fill: true,
                tension: 0.3,
                pointBackgroundColor: '#4361ee',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointHoverBackgroundColor: '#7209b7',
                pointHoverBorderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '스탯 값',
                        font: {
                            weight: 'bold',
                            size: 14
                        },
                        padding: { top: 10, bottom: 10 }
                    },
                    grid: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '대미지',
                        font: {
                            weight: 'bold',
                            size: 14
                        },
                        padding: { top: 10, bottom: 10 }
                    },
                    grid: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        boxWidth: 15,
                        padding: 15,
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                },
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += Math.round(context.parsed.y).toLocaleString();
                            return label;
                        },
                        title: function(context) {
                            return `${context[0].label} 값`;
                        }
                    }
                }
            }
        }
    });
}

// 적 방어력 자동 계산 함수
function updateEnemyDefense() {
    const enemyLevel = Number(document.getElementById('enemyLevel').value);
    const enemyDefense = 792 + (8 * enemyLevel);
    document.getElementById('enemyDefense').value = enemyDefense;
}

// 모든 필요한 스탯 가져오기
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

// 대미지 계산 함수 (스탯 객체 전달 버전)
function calculateDamageWithStats(stats, updateUI = true) {
    // 기본 공격력 계산
    const characterAttack = stats.characterAttack || 0;
    const weaponAttack = stats.weaponAttack || 0;
    const attackPercentage = stats.attackPercentage || 0;
    const fixedAttack = stats.fixedAttack || 0;
    
    // 최종 공격력 계산 (캐릭터 공격력 + 무기 공격력) * (1 + 공격력%) + 고정 공격력
    const finalAttack = (characterAttack + weaponAttack) * (1 + attackPercentage) + fixedAttack;
    
    // 스킬 계수 계산 (기본 스킬 배율%) * (1 + 추가 배율%)
    const baseSkillRatio = stats.baseSkillRatio || 0;
    const additionalRatio = stats.additionalRatio || 0;
    const totalSkillCoef = baseSkillRatio * (1 + additionalRatio);
    
    // 크리티컬 계산 (크리티컬 확률% * 크리티컬 피해%) + (1 - 크리티컬 확률%)
    const critRate = Math.min(stats.critRate || 0, 1); // 100%를 넘지 않도록
    const critDamage = stats.critDamage || 0;
    const critExpectedValue = (critRate * critDamage) + (1 - critRate);
    
    // 대미지 보너스 계산 (1 + 피해 보너스% + 속성 피해 보너스% + 공격 타입 피해 보너스%)
    const damageBonus = stats.damageBonus || 0;
    const elementDamageBonus = stats.elementDamageBonus || 0;
    const attackTypeDamageBonus = stats.attackTypeDamageBonus || 0;
    const totalDamageBonus = 1 + damageBonus + elementDamageBonus + attackTypeDamageBonus;
    
    // 대미지 부스트 계산 (1 + 피해 부스트% + 속성 피해 부스트% + 공격 타입 피해 부스트%)
    const damageBoost = stats.damageBoost || 0;
    const elementDamageBoost = stats.elementDamageBoost || 0;
    const attackTypeDamageBoost = stats.attackTypeDamageBoost || 0;
    const totalDamageBoost = 1 + damageBoost + elementDamageBoost + attackTypeDamageBoost;
    
    // 적 방어율 계산
    // 1 - ((적 방어력(1 - 방어 무시율%)) / ((적 방어력 (1 - 방어 무시율%)) + 800 + 8 * 캐릭터 레벨))
    const enemyDefense = stats.enemyDefense || 0;
    const defenseIgnore = stats.defenseIgnore || 0;
    const characterLevel = stats.characterLevel || 0;
    const effectiveDefense = enemyDefense * (1 - defenseIgnore);
    const enemyDefenseRate = 1 - (effectiveDefense / (effectiveDefense + 800 + 8 * characterLevel));
    
    // 적 저항률 계산
    const enemyResistance = stats.enemyResistance || 0;
    const resistanceReduction = stats.resistanceReduction || 0;
    const effectiveResistance = enemyResistance - resistanceReduction;
    
    let enemyResistanceRate;
    
    if (effectiveResistance >= 0 && effectiveResistance <= 0.8) {
        // 0% <= 적 저항% <= 80%
        enemyResistanceRate = 1 - effectiveResistance;
    } else if (effectiveResistance < 0) {
        // 적 저항% < 0%
        enemyResistanceRate = 1 - (effectiveResistance / 2);
    } else {
        // 적 저항% > 80%
        enemyResistanceRate = 1 / (1 + 5 * effectiveResistance);
    }
    
    // 최종 대미지 계산
    let damage = finalAttack * totalSkillCoef * totalDamageBonus * totalDamageBoost * critExpectedValue * enemyDefenseRate * enemyResistanceRate;
    
    // 최종 대미지 계산 결과 반환 및 중간 파라미터도 함께 반환
    const parameters = {
        finalAttack,
        totalSkillCoef,
        critExpectedValue,
        totalDamageBonus,
        totalDamageBoost,
        enemyDefenseRate,
        enemyResistanceRate
    };
    
    // UI 업데이트 호출 (필요한 경우에만)
    if (updateUI) {
        updateResults(damage, parameters);
    }
    
    return Math.round(damage);
}

// 대미지 계산
function calculateDamage(updateUI = true) {
    // 모든 필요한 스탯 가져오기
    const stats = getAllStats();
    
    // 계산 함수 호출 (결과는 함수 내에서 UI 업데이트됨)
    return calculateDamageWithStats(stats, updateUI);
}

// 결과 UI 업데이트
function updateResults(finalDamage, parameters) {
    // 소수점 2자리까지 반올림
    document.getElementById('finalDamage').textContent = Math.round(finalDamage).toLocaleString();
    document.getElementById('finalAttackResult').textContent = Math.round(parameters.finalAttack).toLocaleString();
    document.getElementById('totalSkillCoefResult').textContent = (parameters.totalSkillCoef * 100).toFixed(2) + '%';
    document.getElementById('critExpectedValueResult').textContent = (parameters.critExpectedValue * 100).toFixed(2) + '%';
    document.getElementById('totalDamageBonusResult').textContent = (parameters.totalDamageBonus * 100).toFixed(2) + '%';
    document.getElementById('totalDamageBoostResult').textContent = (parameters.totalDamageBoost * 100).toFixed(2) + '%';
    document.getElementById('enemyDefenseRateResult').textContent = (parameters.enemyDefenseRate * 100).toFixed(2) + '%';
    document.getElementById('enemyResistanceRateResult').textContent = (parameters.enemyResistanceRate * 100).toFixed(2) + '%';
    
    // 애니메이션 효과 추가
    animateResult();
}

// 결과 수치 애니메이션
function animateResult() {
    const damageValue = document.getElementById('finalDamage');
    
    // 살짝 크기 변경 애니메이션
    damageValue.style.transform = 'scale(1.1)';
    damageValue.style.transition = 'transform 0.2s ease-out';
    
    setTimeout(() => {
        damageValue.style.transform = 'scale(1)';
    }, 300);
}

// 스탯 초기화
function resetStats() {
    // 모든 입력 필드 기본값으로 리셋
    document.getElementById('characterAttack').value = 462;
    document.getElementById('weaponAttack').value = 500;
    document.getElementById('attackPercentage').value = 130.5;
    document.getElementById('fixedAttack').value = 490;
    
    document.getElementById('baseSkillRatio').value = 644.33;
    document.getElementById('additionalRatio').value = 126;
    
    document.getElementById('damageBonus').value = 10;
    document.getElementById('elementDamageBonus').value = 124.5;
    document.getElementById('attackTypeDamageBonus').value = 94.5;
    
    document.getElementById('damageBoost').value = 15;
    document.getElementById('elementDamageBoost').value = 20;
    document.getElementById('attackTypeDamageBoost').value = 25;
    
    document.getElementById('critRate').value = 70.7;
    document.getElementById('critDamage').value = 278.4;
    
    document.getElementById('enemyLevel').value = 120;
    // 적 방어력 자동 계산
    updateEnemyDefense();
    document.getElementById('defenseIgnore').value = 10;
    document.getElementById('characterLevel').value = 90;
    
    document.getElementById('enemyResistance').value = 40;
    document.getElementById('resistanceReduction').value = 10;
    
    // 대미지 계산 및 UI 업데이트
    calculateDamage(true);
}

// 시뮬레이션 실행
function runSimulation() {
    const statName = document.getElementById('simulationStat').value;
    const minValue = Number(document.getElementById('simMinValue').value);
    const maxValue = Number(document.getElementById('simMaxValue').value);
    const stepValue = Number(document.getElementById('simStepValue').value);
    
    // 유효성 검사
    if (minValue >= maxValue) {
        alert('최대값은 최소값보다 커야 합니다.');
        return;
    }
    
    if (stepValue <= 0) {
        alert('증가 단위는 0보다 커야 합니다.');
        return;
    }
    
    // 시뮬레이션 데이터 생성
    const statValues = [];
    const damageValues = [];
    const displayValues = []; // 화면에 표시될 값 (% 표시용)
    
    // 선택된 스탯의 레이블 텍스트 가져오기
    const statOption = document.querySelector(`option[value="${statName}"]`);
    let statLabel = statOption ? statOption.textContent : statName;
    
    // 현재 스탯 복사
    const baseStats = getAllStats();
    
    // 퍼센트 값인지 확인 (이름에 Percentage, Ratio, Rate 등이 포함된 경우)
    const isPercentage = statName.includes('Percentage') || 
                        statName.includes('Ratio') || 
                        statName.includes('Rate') || 
                        statName.includes('Boost') || 
                        statName.includes('Ignore') || 
                        statName.includes('Reduction') ||
                        statName.includes('Resistance') ||
                        statName.includes('Damage') ||
                        statName.includes('Bonus');
    
    // 시뮬레이션 범위 내에서 대미지 계산
    for (let value = minValue; value <= maxValue; value += stepValue) {
        // 표시용 값은 그대로 저장
        displayValues.push(value);
        
        // 계산용 값 (퍼센트 값은 100으로 나누어 적용)
        const calcValue = isPercentage ? value / 100 : value;
        statValues.push(calcValue);
        
        // 스탯 객체 복사본 생성
        const simulatedStats = {...baseStats};
        
        // 스탯 값 업데이트
        simulatedStats[statName] = calcValue;
        
        // 적 레벨이 변경되면 적 방어력도 업데이트
        if (statName === 'enemyLevel') {
            simulatedStats.enemyDefense = 792 + (8 * simulatedStats.enemyLevel);
        }
        
        // 복사된 스탯으로 대미지 계산 (UI 업데이트 없이)
        const damage = calculateDamageWithStats(simulatedStats, false);
        damageValues.push(damage);
    }
    
    // 차트 업데이트 (displayValues를 차트 라벨로 사용)
    updateSimulationChart(displayValues, damageValues, statLabel, isPercentage);
    
    // 최대값/최소값 표시
    const maxDamage = Math.max(...damageValues);
    const minDamage = Math.min(...damageValues);
    const maxDamageIndex = damageValues.indexOf(maxDamage);
    const minDamageIndex = damageValues.indexOf(minDamage);
    
    console.log(`최대 대미지: ${maxDamage.toLocaleString()} (${statLabel} = ${displayValues[maxDamageIndex]}${isPercentage ? '%' : ''})`);
    console.log(`최소 대미지: ${minDamage.toLocaleString()} (${statLabel} = ${displayValues[minDamageIndex]}${isPercentage ? '%' : ''})`);
    
    // 결과 섹션 스크롤
    document.querySelector('.simulation-results').scrollIntoView({ behavior: 'smooth' });
}

// 시뮬레이션 차트 업데이트
function updateSimulationChart(labels, damageValues, statName, isPercentage = false) {
    // 기존 데이터 저장
    currentSimulationData = {
        labels: labels,
        values: damageValues,
        statName: statName,
        isPercentage: isPercentage
    };
    
    // X축 라벨 업데이트
    const statLabels = labels.map(value => {
        // 소수점이 있는 경우 소수점 두 자리까지 표시
        if (Number.isInteger(value)) {
            return value.toString() + (isPercentage ? '%' : '');
        } else {
            return value.toFixed(2) + (isPercentage ? '%' : '');
        }
    });
    
    // 그래프의 그라디언트 배경 업데이트
    const ctx = simulationChart.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(67, 97, 238, 0.25)');
    gradient.addColorStop(1, 'rgba(67, 97, 238, 0.02)');
    
    // 데이터셋 업데이트
    simulationChart.data.labels = statLabels;
    simulationChart.data.datasets[0].data = damageValues;
    simulationChart.data.datasets[0].backgroundColor = gradient;
    simulationChart.data.datasets[0].label = `${statName} 변화에 따른 대미지`;
    
    // 축 제목 업데이트
    simulationChart.options.scales.x.title.text = `${statName} 값${isPercentage ? ' (%)' : ''}`;
    
    // 범례 업데이트
    simulationChart.options.plugins.legend.labels.generateLabels = function(chart) {
        const originalLabels = Chart.defaults.plugins.legend.labels.generateLabels(chart);
        if (originalLabels.length > 0) {
            originalLabels[0].text = `${statName} 변화에 따른 대미지`;
        }
        return originalLabels;
    };
    
    // 애니메이션과 함께 차트 업데이트
    simulationChart.update('active');
    
    // 차트 섹션으로 부드럽게 스크롤
    document.querySelector('.simulation-results').scrollIntoView({ behavior: 'smooth' });
}

// 프리셋 목록 불러오기
function loadPresets() {
    const presetList = document.getElementById('presetList');
    
    // 목록 초기화
    presetList.innerHTML = '';
    
    if (presets.length === 0) {
        presetList.innerHTML = '<div class="empty-state">저장된 프리셋이 없습니다</div>';
        return;
    }
    
    // 프리셋 아이템 생성
    presets.forEach(preset => {
        // 모달용 아이템
        const item = document.createElement('div');
        item.className = 'preset-item';
        item.innerHTML = `
            <div class="preset-info">
                <div class="preset-name">${preset.name}</div>
                <div class="preset-description">${preset.description || '설명 없음'}</div>
                <div class="preset-date">${formatDate(new Date(preset.createdAt))}</div>
            </div>
            <div class="preset-actions">
                <button class="load-preset-btn secondary-btn" data-id="${preset.id}">
                    <i class="bi bi-check-circle"></i> 적용
                </button>
                <button class="delete-preset-btn secondary-btn" data-id="${preset.id}">
                    <i class="bi bi-trash"></i> 삭제
                </button>
            </div>
        `;
        
        presetList.appendChild(item);
        
        // 이벤트 리스너 추가
        item.querySelector('.load-preset-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            loadPreset(preset.id);
            closePresetModal();
        });
        
        item.querySelector('.delete-preset-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            deletePreset(preset.id);
        });
    });
}

// 날짜 포맷팅 함수
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 프리셋 불러오기
function loadPreset(presetId) {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) {
        alert('프리셋을 찾을 수 없습니다.');
        return;
    }
    
    try {
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
        
        // 모든 입력 필드 설정
        for (const key in stats) {
            const input = document.getElementById(key);
            if (input) {
                // 백분율 필드인 경우 100을 곱해서 표시
                if (percentFields.includes(key)) {
                    input.value = (stats[key] * 100).toFixed(2);
                } else {
                    input.value = stats[key];
                }
            }
        }
        
        // 적 레벨에 따라 적 방어력 업데이트
        updateEnemyDefense();
        
        // 대미지 다시 계산
        calculateDamage();
        
        alert(`프리셋 '${preset.name}'을(를) 불러왔습니다.`);
    } catch (error) {
        console.error('프리셋 로드 오류:', error);
        alert('프리셋을 불러오는 중 오류가 발생했습니다.');
    }
}

// 프리셋 모달 닫기
function closePresetModal() {
    const modal = document.getElementById('presetModal');
    modal.style.display = 'none';
}

// 프리셋 모달 열기
function openPresetModal() {
    const modal = document.getElementById('presetModal');
    modal.style.display = 'block';
}

// 차트를 이미지로 내보내기
function exportChartAsImage() {
    if (!simulationChart) {
        alert('내보낼 차트가 없습니다. 먼저 시뮬레이션을 실행해주세요.');
        return;
    }
    
    // 차트를 이미지 URL로 변환
    const imageURL = simulationChart.toBase64Image('image/png', 1.0);
    
    // 가상 링크 생성 및 다운로드
    const downloadLink = document.createElement('a');
    downloadLink.href = imageURL;
    downloadLink.download = '대미지_시뮬레이션_차트.png';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

// 시뮬레이션 데이터를 CSV로 내보내기
function exportDataAsCSV() {
    if (!currentSimulationData || !currentSimulationData.labels || currentSimulationData.labels.length === 0) {
        alert('내보낼 데이터가 없습니다. 먼저 시뮬레이션을 실행해주세요.');
        return;
    }
    
    // CSV 데이터 생성
    let csvContent = `${currentSimulationData.statName}${currentSimulationData.isPercentage ? '(%)' : ''},대미지\n`;
    
    for (let i = 0; i < currentSimulationData.labels.length; i++) {
        // 비율(%) 값인 경우 % 기호 표시
        const labelValue = currentSimulationData.labels[i];
        csvContent += `${labelValue}${currentSimulationData.isPercentage ? '%' : ''},${currentSimulationData.values[i]}\n`;
    }
    
    // Blob 생성 및 다운로드
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = '대미지_시뮬레이션_데이터.csv';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 100);
}

// 민감도 분석 설정 화면 표시
function showSensitivitySettings() {
    // 민감도 분석 설정 섹션 표시
    document.getElementById('sensitivitySettingsSection').style.display = 'block';
    // 민감도 분석 결과 섹션 숨기기
    document.getElementById('sensitivitySection').style.display = 'none';
    // 결론 섹션 숨기기
    document.getElementById('conclusionSection').style.display = 'none';
}

// 민감도 분석 설정 초기화
function resetSensitivitySettings(showAlert = true) {
    // 공격력 관련 초기화
    document.getElementById('charAtkInc').value = 3;
    document.getElementById('weaponAtkInc').value = 3;
    document.getElementById('atkPctInc').value = 0.61;
    document.getElementById('fixedAtkInc').value = 3;
    
    // 스킬 계수 초기화
    document.getElementById('skillRatioInc').value = 7.075;
    document.getElementById('additionalRatioInc').value = 0.61;
    
    // 크리티컬 스탯 초기화
    document.getElementById('critRateInc').value = 0.407;
    document.getElementById('critDmgInc').value = 0.813;
    
    // 대미지 보너스 초기화
    document.getElementById('dmgBonusInc').value = 0.61;
    document.getElementById('elemBonusInc').value = 0.61;
    document.getElementById('atkTypeBonusInc').value = 0.61;
    
    // 대미지 부스트 초기화
    document.getElementById('dmgBoostInc').value = 0.61;
    document.getElementById('elemBoostInc').value = 0.61;
    document.getElementById('atkTypeBoostInc').value = 0.61;
    
    // 적 방어율 초기화
    document.getElementById('defIgnoreInc').value = 0.61;
    document.getElementById('enemyLevelInc').value = -1;
    document.getElementById('charLevelInc').value = 1;
    
    // 적 저항률 초기화
    document.getElementById('resReductionInc').value = 0.61;
    
    // HTML에서 적 저항 관련 입력 필드 숨기기
    const enemyResistanceField = document.querySelector('[for="enemyResistanceInc"]').parentElement;
    if (enemyResistanceField) {
        enemyResistanceField.style.display = 'none';
    }
    
    // 매개변수에 따라 알림 표시 여부 결정
    if (showAlert) {
        alert('민감도 분석 설정이 초기화되었습니다.');
    }
}

// 사용자 설정 증가량 가져오기
function getSensitivityIncrements() {
    return {
        // 공격력 관련
        characterAttack: Number(document.getElementById('charAtkInc').value),
        weaponAttack: Number(document.getElementById('weaponAtkInc').value),
        attackPercentage: Number(document.getElementById('atkPctInc').value) / 100,
        fixedAttack: Number(document.getElementById('fixedAtkInc').value),
        
        // 스킬 계수
        baseSkillRatio: Number(document.getElementById('skillRatioInc').value) / 100,
        additionalRatio: Number(document.getElementById('additionalRatioInc').value) / 100,
        
        // 크리티컬 스탯
        critRate: Number(document.getElementById('critRateInc').value) / 100,
        critDamage: Number(document.getElementById('critDmgInc').value) / 100,
        
        // 대미지 보너스
        damageBonus: Number(document.getElementById('dmgBonusInc').value) / 100,
        elementDamageBonus: Number(document.getElementById('elemBonusInc').value) / 100,
        attackTypeDamageBonus: Number(document.getElementById('atkTypeBonusInc').value) / 100,
        
        // 대미지 부스트
        damageBoost: Number(document.getElementById('dmgBoostInc').value) / 100,
        elementDamageBoost: Number(document.getElementById('elemBoostInc').value) / 100,
        attackTypeDamageBoost: Number(document.getElementById('atkTypeBoostInc').value) / 100,
        
        // 적 방어율
        defenseIgnore: Number(document.getElementById('defIgnoreInc').value) / 100,
        enemyLevel: Number(document.getElementById('enemyLevelInc').value),
        characterLevel: Number(document.getElementById('charLevelInc').value),
        
        // 적 저항률
        resistanceReduction: Number(document.getElementById('resReductionInc').value) / 100
    };
}

// 민감도 분석 함수 구현
function runSensitivityAnalysis() {
    // 민감도 분석 설정 섹션 숨기기
    document.getElementById('sensitivitySettingsSection').style.display = 'none';
    
    // 현재 스탯 값들 가져오기
    const baseStats = getAllStats();
    
    // 사용자 설정 증가량 가져오기
    const increments = getSensitivityIncrements();
    
    // 기본 대미지 계산 (비교 기준)
    const baseDamage = calculateDamageWithStats(baseStats, false);
    
    // 분석할 스탯 그룹 정의
    const statGroups = {
        "공격력 관련": [
            { name: "캐릭터 공격력", key: "characterAttack", increment: increments.characterAttack, unit: "" },
            { name: "무기 공격력", key: "weaponAttack", increment: increments.weaponAttack, unit: "" },
            { name: "공격력 증가율", key: "attackPercentage", increment: increments.attackPercentage, unit: "%" },
            { name: "고정 공격력", key: "fixedAttack", increment: increments.fixedAttack, unit: "" }
        ],
        "스킬 계수": [
            { name: "기본 스킬 배율", key: "baseSkillRatio", increment: increments.baseSkillRatio, unit: "%" },
            { name: "추가 배율", key: "additionalRatio", increment: increments.additionalRatio, unit: "%" }
        ],
        "크리티컬 스탯": [
            { name: "크리티컬 확률", key: "critRate", increment: increments.critRate, unit: "%" },
            { name: "크리티컬 대미지", key: "critDamage", increment: increments.critDamage, unit: "%" }
        ],
        "대미지 보너스": [
            { name: "피해 보너스", key: "damageBonus", increment: increments.damageBonus, unit: "%" },
            { name: "속성 피해 보너스", key: "elementDamageBonus", increment: increments.elementDamageBonus, unit: "%" },
            { name: "공격 타입 피해 보너스", key: "attackTypeDamageBonus", increment: increments.attackTypeDamageBonus, unit: "%" }
        ],
        "대미지 부스트": [
            { name: "피해 부스트", key: "damageBoost", increment: increments.damageBoost, unit: "%" },
            { name: "속성 피해 부스트", key: "elementDamageBoost", increment: increments.elementDamageBoost, unit: "%" },
            { name: "공격 타입 피해 부스트", key: "attackTypeDamageBoost", increment: increments.attackTypeDamageBoost, unit: "%" }
        ],
        "적 방어율": [
            { name: "방어 무시율", key: "defenseIgnore", increment: increments.defenseIgnore, unit: "%" },
            { name: "캐릭터 레벨", key: "characterLevel", increment: increments.characterLevel, unit: "" },
            { name: "적 레벨", key: "enemyLevel", increment: increments.enemyLevel, unit: "", isNegative: true }
        ],
        "적 저항률": [
            { name: "저항 감소율", key: "resistanceReduction", increment: increments.resistanceReduction, unit: "%" }
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
            const { name, key, increment, unit, isNegative } = statInfo;
            
            // 현재 스탯 값 가져오기 (베이스 스탯에서)
            const currentValue = baseStats[key];
            
            // 새로운 스탯을 위한 객체 복사
            const simulatedStats = {...baseStats};
            
            // 새로운 스탯 값 설정 (증가량 더하기)
            simulatedStats[key] = currentValue + increment;
            
            // 적 레벨이 변경되면 적 방어력도 업데이트
            if (key === 'enemyLevel') {
                simulatedStats.enemyDefense = 792 + (8 * simulatedStats.enemyLevel);
            }
            
            // 새 대미지 계산 (UI 업데이트 없이)
            const newDamage = calculateDamageWithStats(simulatedStats, false);
            
            // 변화율 계산
            let changePercent;
            let impactClass;
            let isPositive;
            
            if (isNegative) {
                // 적 스탯과 같이 증가가 부정적 영향을 주는 경우 (부호 반전)
                changePercent = ((baseDamage - newDamage) / baseDamage * 100);
                isPositive = changePercent < 0; // 부호 반전 (적 스탯 증가 → 대미지 감소 → 부정적)
            } else {
                // 일반적인 경우 (증가가 긍정적 영향)
                changePercent = ((newDamage - baseDamage) / baseDamage * 100);
                isPositive = changePercent > 0;
            }
            
            // 변화율의 절대값으로 영향도 결정
            const absChange = Math.abs(changePercent);
            if (absChange > 5) impactClass = 'high-impact';
            else if (absChange > 2) impactClass = 'medium-impact';
            else impactClass = 'low-impact';
            
            // 변화율 소수점 2자리로 포맷팅
            const formattedChangePercent = changePercent.toFixed(2);
            
            // 표시할 증가량 (단위 적용)
            const displayIncrement = unit === '%' ? 
                `+${(increment * 100).toFixed(1)}${unit}` : 
                `+${increment}${unit}`;
            
            // 표시할 현재 값 (단위 적용)
            const displayValue = unit === '%' ? 
                `${(currentValue * 100).toFixed(1)}${unit}` : 
                `${currentValue}${unit}`;
            
            // 민감도 데이터 저장
            currentSensitivityData.push({
                group: groupName,
                name: name,
                originalValue: displayValue,
                increment: displayIncrement,
                newDamage: newDamage,
                changePercent: formattedChangePercent,
                impact: impactClass,
                isPositive: isPositive,
                absChangeValue: absChange  // 영향도 순기 매기기 위한 절대값 저장
            });
        });
    }
    
    // 영향도 순위 계산 (절대값 기준으로 내림차순 정렬)
    currentSensitivityData.sort((a, b) => b.absChangeValue - a.absChangeValue);
    
    // 순위 정보 추가
    currentSensitivityData.forEach((item, index) => {
        item.rank = index + 1;
    });
    
    // 원래 그룹 순서로 복원 (그룹 내에서는 영향도순)
    const groupOrder = Object.keys(statGroups);
    const groupedData = {};
    
    // 그룹별로 데이터 분류
    groupOrder.forEach(group => {
        groupedData[group] = currentSensitivityData.filter(item => item.group === group)
            .sort((a, b) => b.absChangeValue - a.absChangeValue);
    });
    
    // 결과 표시 영역 다시 초기화
    resultsContainer.innerHTML = '';
    resultsContainer.appendChild(headerRow);
    
    // 그룹별로 데이터 표시
    groupOrder.forEach(groupName => {
        // 그룹 헤더 추가
        const groupHeader = document.createElement('div');
        groupHeader.className = 'stat-group-header';
        groupHeader.textContent = groupName;
        resultsContainer.appendChild(groupHeader);
        
        // 해당 그룹의 데이터 표시
        groupedData[groupName].forEach(item => {
            // 결과 행 생성
            const resultRow = document.createElement('div');
            resultRow.className = 'result-row';
            resultRow.innerHTML = `
                <span>${item.name}</span>
                <span>${item.originalValue}</span>
                <span>${item.increment}</span>
                <span>${Math.floor(item.newDamage).toLocaleString()}</span>
                <span class="${item.impact}" data-positive="${item.isPositive}">
                    ${item.isPositive ? '+' : ''}${item.changePercent}%
                </span>
                <span>
                    <div class="impact-level ${item.impact}" title="전체 순위: ${item.rank}위"></div>
                    <small class="rank-number">${item.rank}위</small>
                </span>
            `;
            
            resultsContainer.appendChild(resultRow);
        });
    });
    
    // 결론 생성 버튼 추가
    const conclusionButtonContainer = document.createElement('div');
    conclusionButtonContainer.className = 'action-buttons';
    conclusionButtonContainer.style.marginTop = '20px';
    conclusionButtonContainer.innerHTML = `
        <button id="showConclusionButton" class="primary-btn" onclick="showConclusion()">
            <i class="bi bi-lightbulb"></i> 결론 보기
        </button>
    `;
    resultsContainer.appendChild(conclusionButtonContainer);
    
    // 민감도 결과 섹션 표시
    document.getElementById('sensitivitySection').style.display = 'block';
    
    // 결과 섹션으로 스크롤
    document.getElementById('sensitivitySection').scrollIntoView({ behavior: 'smooth' });
}

// 민감도 분석 결론 표시 함수
function showConclusion() {
    // 결론 섹션 표시
    const conclusionSection = document.getElementById('conclusionSection');
    conclusionSection.style.display = 'block';
    
    // 결론 내용 컨테이너 가져오기
    const conclusionContent = document.getElementById('conclusionContent');
    
    // 데이터가 없으면 중단
    if (!currentSensitivityData || currentSensitivityData.length === 0) {
        conclusionContent.innerHTML = '<p>분석 결과가 없습니다.</p>';
        return;
    }
    
    // 영향도가 높은 순으로 정렬 (절대값 기준)
    const sortedData = [...currentSensitivityData].sort((a, b) => {
        const absChangeA = Math.abs(parseFloat(a.changePercent));
        const absChangeB = Math.abs(parseFloat(b.changePercent));
        return absChangeB - absChangeA;
    });
    
    // 상위 5개 추출
    const topStats = sortedData.slice(0, 5);
    
    // 결론 설명 추가
    const conclusionDesc = document.createElement('p');
    conclusionDesc.className = 'settings-description';
    conclusionDesc.innerHTML = '대미지에 가장 큰 영향을 미치는 상위 5개 스탯입니다. 투자 우선순위를 결정할 때 참고하세요.';
    conclusionContent.innerHTML = '';
    conclusionContent.appendChild(conclusionDesc);
    
    // 결론 리스트 추가
    const conclusionList = document.createElement('ol');
    conclusionList.className = 'conclusion-list';
    
    topStats.forEach(stat => {
        const listItem = document.createElement('li');
        
        // 스탯 영향도에 따른 배경색 지정
        listItem.className = stat.impact;
        
        if (stat.name.includes('적') && (stat.name.includes('레벨') || stat.name.includes('저항'))) {
            // 적 스탯은 감소가 유리함을 표시
            listItem.innerHTML = `
                <strong>${stat.name}</strong>: 
                <span class="${stat.impact}">${stat.changePercent}%</span> 
                (${stat.group})
                - <strong>감소시키는 것이 유리합니다</strong>
                <p class="stat-tip">설명: 적 ${stat.name}은 높을수록 캐릭터의 대미지가 감소합니다. 가능한 낮은 ${stat.name}의 적을 상대하거나, ${stat.name} 감소 효과를 가진 스킬/아이템을 활용하세요.</p>
            `;
        } else {
            const changeDirection = stat.isPositive ? '증가' : '감소';
            const effectPerPoint = (parseFloat(stat.changePercent) / (parseFloat(stat.increment.replace(/[+%]/g, '')))).toFixed(2);
            
            let tipText = '';
            // 스탯 유형별 팁 추가
            if (stat.group === '공격력 관련') {
                tipText = `공격력은 대미지 계산의 기본이 되는 중요한 요소입니다. 1포인트 증가 시 약 ${effectPerPoint}%의 대미지 상승 효과가 있습니다.`;
            } else if (stat.group === '스킬 계수') {
                tipText = `스킬 계수는 스킬 레벨업이나 특정 특성 선택으로 증가시킬 수 있습니다. 1% 증가 시 약 ${effectPerPoint}%의 대미지 상승 효과가 있습니다.`;
            } else if (stat.group === '크리티컬 스탯') {
                tipText = `크리티컬 관련 스탯은 높은 폭발력을 제공합니다. 1% 증가 시 약 ${effectPerPoint}%의 대미지 상승 효과가 있으며, 크리티컬 확률이 높을수록 크리티컬 대미지의 효율이 올라갑니다.`;
            } else if (stat.group.includes('대미지')) {
                tipText = `${stat.group}는 최종 대미지 계산 시 곱연산으로 적용되어 효율이 좋습니다. 1% 증가 시 약 ${effectPerPoint}%의 대미지 상승 효과가 있습니다.`;
            }
            
            listItem.innerHTML = `
                <strong>${stat.name}</strong>: 
                <span class="${stat.impact}">${stat.isPositive ? '+' : ''}${stat.changePercent}%</span> 
                ${changeDirection} (${stat.group})
                <p class="stat-tip">효율: 1포인트당 약 ${effectPerPoint}% 대미지 변화</p>
                <p class="stat-tip">설명: ${tipText}</p>
            `;
        }
        
        conclusionList.appendChild(listItem);
    });
    
    conclusionContent.appendChild(conclusionList);
    
    // 적 상대 전략
    const enemyStats = topStats.filter(stat => 
        !stat.isPositive && (stat.name.includes('적') || stat.name.includes('저항') || stat.name.includes('방어'))
    );
    
    if (enemyStats.length > 0) {
        const enemySection = document.createElement('div');
        enemySection.className = 'enemy-strategy-section';
        
        const enemyHeader = document.createElement('h3');
        enemyHeader.textContent = '적 상대 전략';
        enemySection.appendChild(enemyHeader);
        
        const enemyContent = document.createElement('p');
        enemyContent.innerHTML = `${enemyStats.map(s => `<span class="${s.impact}">${s.name}</span>`).join(', ')}에 주의하세요. `;
        enemyContent.innerHTML += '이러한 요소가 낮은 적을 우선적으로 상대하거나, 해당 요소를 감소시키는 효과를 가진 스킬/아이템을 활용하세요.';
        
        enemySection.appendChild(enemyContent);
        conclusionContent.appendChild(enemySection);
    }
    
    // 결론 섹션으로 스크롤
    conclusionSection.scrollIntoView({ behavior: 'smooth' });
}

// 현재 상태를 프리셋으로 저장
function saveCurrentAsPreset() {
    // 모달 열기
    openPresetModal();
    
    // 입력 필드 초기화
    document.getElementById('presetName').value = '';
    document.getElementById('presetDescription').value = '';
    
    // 저장 모드로 포커스
    document.getElementById('presetName').focus();
}

// 새 프리셋 저장 (설명 포함)
function saveNewPreset() {
    const presetName = document.getElementById('presetName').value.trim();
    const presetDescription = document.getElementById('presetDescription').value.trim();
    
    if (!presetName) {
        alert('프리셋 이름을 입력해주세요.');
        return;
    }
    
    try {
        // 현재 스탯 값 가져오기
        const stats = getAllStats();
        
        // 프리셋 객체 생성
        const newPreset = {
            id: Date.now().toString(),
            name: presetName,
            description: presetDescription,
            stats: stats,
            createdAt: new Date().toISOString()
        };
        
        // 프리셋 배열에 추가
        presets.push(newPreset);
        
        // 로컬 스토리지에 저장
        localStorage.setItem('damagePresets', JSON.stringify(presets));
        
        // 입력 필드 초기화
        document.getElementById('presetName').value = '';
        document.getElementById('presetDescription').value = '';
        
        // 프리셋 목록 다시 로드
        loadPresets();
        
        alert(`프리셋 '${presetName}'이(가) 저장되었습니다.`);
        
        // 모달 닫기
        closePresetModal();
    } catch (error) {
        console.error('프리셋 저장 오류:', error);
        alert('프리셋을 저장하는 중 오류가 발생했습니다.');
    }
}

// 프리셋 삭제
function deletePreset(presetId) {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) {
        alert('프리셋을 찾을 수 없습니다.');
        return;
    }
    
    if (confirm(`프리셋 '${preset.name}'을(를) 삭제하시겠습니까?`)) {
        try {
            // 프리셋 배열에서 삭제
            const index = presets.findIndex(p => p.id === presetId);
            if (index !== -1) {
                presets.splice(index, 1);
                
                // 로컬 스토리지 업데이트
                localStorage.setItem('damagePresets', JSON.stringify(presets));
                
                // 프리셋 목록 다시 로드
                loadPresets();
                
                alert(`프리셋 '${preset.name}'이(가) 삭제되었습니다.`);
            }
        } catch (error) {
            console.error('프리셋 삭제 오류:', error);
            alert('프리셋을 삭제하는 중 오류가 발생했습니다.');
        }
    }
}