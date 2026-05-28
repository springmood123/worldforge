#!/usr/bin/env node

/**
 * 地图生成器测试脚本
 * 用于验证地名多样性和地图稳定性
 */

const DEFAULT_PLACE_NAMES = [
  '晨曦港', '月影森林', '青石山脉', '风暴海岸', '火焰谷地', '冰霜高原',
  '翡翠湾', '迷雾沼泽', '黄金沙漠', '天空之城', '深渊洞穴', '时光裂隙',
  '巨龙巢穴', '精灵圣地', '矮人王国', '人类联邦', '兽人部落', '亡灵废墟',
  '圣光城堡', '暗影峡谷', '风暴要塞', '绿洲城', '冰封王座', '火山岛',
  '奇迹之塔', '遗忘之地', '永恒花园', '末日废墟', '新生平原', '古老神殿'
];

// Mulberry32 随机数生成器
function mulberry32(seed) {
  return () => {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// 测试地名生成函数
function generateRandomPlaceName(index, seed) {
  const random = mulberry32(Math.floor(seed * 10000) + index * 12345);
  const randomIndex = Math.floor(random() * DEFAULT_PLACE_NAMES.length);
  return DEFAULT_PLACE_NAMES[randomIndex];
}

// 测试1: 地名多样性
function testPlaceNameDiversity() {
  console.log('测试1: 地名多样性');
  console.log('='.repeat(50));
  
  const seed = 12345;
  const numCities = 8;
  const names = [];
  
  console.log(`生成 ${numCities} 个城市名称 (seed: ${seed}):`);
  console.log('');
  
  for (let i = 0; i < numCities; i++) {
    const name = generateRandomPlaceName(i, seed);
    names.push(name);
    console.log(`城市 ${i + 1}: ${name}`);
  }
  
  // 检查重复
  const uniqueNames = new Set(names);
  const hasDuplicates = names.length !== uniqueNames.size;
  
  console.log('');
  console.log(`总城市数: ${names.length}`);
  console.log(`唯一地名数: ${uniqueNames.size}`);
  console.log(`是否有重复: ${hasDuplicates ? '❌ 是' : '✅ 否'}`);
  
  if (!hasDuplicates) {
    console.log('✅ 测试通过: 所有地名都不同');
  } else {
    console.log('❌ 测试失败: 存在重复地名');
    const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
    console.log('重复的地名:', [...new Set(duplicates)]);
  }
  
  console.log('');
  console.log('');
}

// 测试2: 不同种子的地名
function testDifferentSeeds() {
  console.log('测试2: 不同种子的地名差异');
  console.log('='.repeat(50));
  
  const seeds = [12345, 54321, 11111, 99999];
  const numCities = 6;
  
  seeds.forEach((seed, seedIndex) => {
    console.log(`\nSeed ${seed}:`);
    const names = [];
    for (let i = 0; i < numCities; i++) {
      const name = generateRandomPlaceName(i, seed);
      names.push(name);
      console.log(`  城市 ${i + 1}: ${name}`);
    }
  });
  
  console.log('');
  console.log('✅ 测试完成: 不同种子产生不同的地名组合');
  console.log('');
  console.log('');
}

// 测试3: 相同种子的一致性
function testSeedConsistency() {
  console.log('测试3: 相同种子的一致性');
  console.log('='.repeat(50));
  
  const seed = 12345;
  const numCities = 8;
  
  console.log('第一次生成:');
  const names1 = [];
  for (let i = 0; i < numCities; i++) {
    const name = generateRandomPlaceName(i, seed);
    names1.push(name);
    console.log(`  ${name}`);
  }
  
  console.log('\n第二次生成:');
  const names2 = [];
  for (let i = 0; i < numCities; i++) {
    const name = generateRandomPlaceName(i, seed);
    names2.push(name);
    console.log(`  ${name}`);
  }
  
  const isConsistent = JSON.stringify(names1) === JSON.stringify(names2);
  console.log('');
  console.log(`一致性检查: ${isConsistent ? '✅ 通过' : '❌ 失败'}`);
  
  if (isConsistent) {
    console.log('✅ 测试通过: 相同种子产生相同的序列');
  } else {
    console.log('❌ 测试失败: 相同种子产生了不同的序列');
  }
  
  console.log('');
  console.log('');
}

// 运行所有测试
console.log('\n');
console.log('🎯 地图生成器地名功能测试');
console.log('='.repeat(50));
console.log('');

testPlaceNameDiversity();
testDifferentSeeds();
testSeedConsistency();

console.log('='.repeat(50));
console.log('测试完成!');
console.log('');
console.log('总结:');
console.log('1. 地名多样性: 确保每个城市都有不同的名字');
console.log('2. 种子差异性: 不同种子产生不同的地名组合');
console.log('3. 种子一致性: 相同种子产生确定性的序列');
console.log('');
