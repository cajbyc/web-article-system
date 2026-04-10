/**
 * Prisma 种子脚本 - 初始化分类数据
 */
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const categories = [
  { name: '学习笔记', sort: 1 },
  { name: '课程报告', sort: 2 },
  { name: '技术分享', sort: 3 },
  { name: '校园随笔', sort: 4 },
  { name: '学术交流', sort: 5 },
]

async function main() {
  console.log('🌱 开始初始化种子数据...')

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    })
    console.log(`✅ 分类: ${cat.name}`)
  }

  console.log('🎉 种子数据初始化完成！')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
