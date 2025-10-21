import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code2, FileQuestion, BarChart3, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* 导航栏 */}
      <nav className="border-b bg-white/50 backdrop-blur-sm dark:bg-gray-900/50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <Code2 className="h-6 w-6" />
            <span className="text-xl font-bold">AI 面试系统</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">登录</Button>
            </Link>
            <Link href="/register">
              <Button>注册</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-5xl font-bold tracking-tight">
            智能化面试评估平台
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-gray-600 dark:text-gray-400">
            结合 AI 技术的在线面试系统，支持编程题、问答题，提供实时评分与智能反馈
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="text-lg">
                开始使用
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="text-lg">
                查看演示
              </Button>
            </Link>
          </div>
        </div>

        {/* 功能特性 */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <Code2 className="mb-2 h-10 w-10 text-primary" />
              <CardTitle>在线编程</CardTitle>
              <CardDescription>
                内置代码编辑器，支持多种编程语言，实时运行和测试
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <FileQuestion className="mb-2 h-10 w-10 text-primary" />
              <CardTitle>问答评估</CardTitle>
              <CardDescription>
                AI 智能评估问答题，提供详细的反馈和建议
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="mb-2 h-10 w-10 text-primary" />
              <CardTitle>智能评分</CardTitle>
              <CardDescription>
                自动评分系统，结合 AI 和人工复核，确保评估准确性
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="mb-2 h-10 w-10 text-primary" />
              <CardTitle>多角色管理</CardTitle>
              <CardDescription>
                支持候选人、面试官、管理员多种角色，权限清晰
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* 使用流程 */}
        <div className="mt-16">
          <h2 className="mb-8 text-center text-3xl font-bold">使用流程</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                1
              </div>
              <h3 className="mb-2 text-xl font-semibold">注册登录</h3>
              <p className="text-gray-600 dark:text-gray-400">
                创建账号，选择对应角色（候选人/面试官/管理员）
              </p>
            </div>

            <div className="text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                2
              </div>
              <h3 className="mb-2 text-xl font-semibold">参与面试</h3>
              <p className="text-gray-600 dark:text-gray-400">
                候选人进入面试场次，完成编程题和问答题
              </p>
            </div>

            <div className="text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                3
              </div>
              <h3 className="mb-2 text-xl font-semibold">查看报告</h3>
              <p className="text-gray-600 dark:text-gray-400">
                获取 AI 评分和面试官反馈，生成详细面试报告
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="border-t bg-white/50 backdrop-blur-sm dark:bg-gray-900/50">
        <div className="container mx-auto px-4 py-8 text-center text-gray-600 dark:text-gray-400">
          <p>© 2024 AI 面试系统. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

