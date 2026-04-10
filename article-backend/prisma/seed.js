/**
 * Prisma 种子脚本 - 初始化管理员账号和分类数据
 * 运行方式：npx prisma db seed
 */
const { PrismaClient } = require('@prisma/client')
const { hashPassword } = require('../src/utils')
const prisma = new PrismaClient()

const categories = [
  { name: '学习笔记', sort: 1 },
  { name: '课程报告', sort: 2 },
  { name: '技术分享', sort: 3 },
  { name: '校园随笔', sort: 4 },
  { name: '学术交流', sort: 5 },
]

const defaultAdmin = {
  username: 'admin',
  password: 'admin123456',
  nickname: '管理员',
  email: 'admin@article-system.com',
  role: 'admin',
  status: true,
}

async function main() {
  console.log('🌱 开始初始化种子数据...')

  // 初始化分类
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    })
    console.log(`✅ 分类: ${cat.name}`)
  }

  // 初始化管理员账号
  const existingAdmin = await prisma.user.findUnique({ where: { username: defaultAdmin.username } })
  if (!existingAdmin) {
    const hashedPwd = await hashPassword(defaultAdmin.password)
    await prisma.user.create({
      data: {
        username: defaultAdmin.username,
        password: hashedPwd,
        nickname: defaultAdmin.nickname,
        email: defaultAdmin.email,
        role: defaultAdmin.role,
        status: defaultAdmin.status,
      },
    })
    console.log(`✅ 管理员账号: ${defaultAdmin.username} / ${defaultAdmin.password}（请及时修改默认密码）`)
  } else {
    console.log('⏩ 管理员账号已存在，跳过创建')
  }

  console.log('🎉 种子数据初始化完成！')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
