"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { interviewsApi } from "@/lib/api";
import { Calendar, Clock, FileText, LogOut } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(userData));
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const response = await interviewsApi.getSessions();
      setSessions(response.data);
    } catch (error) {
      console.error("Failed to load sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* 导航栏 */}
      <nav className="border-b bg-white/50 backdrop-blur-sm dark:bg-gray-900/50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold">AI 面试系统</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {user.username} ({user.role?.name})
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              退出
            </Button>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">欢迎回来，{user.username}！</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            这是您的面试管理面板
          </p>
        </div>

        {/* 快捷操作 */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                我的面试
              </CardTitle>
              <CardDescription>查看和管理您的面试场次</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push("/interviews")}>
                查看面试
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                题库管理
              </CardTitle>
              <CardDescription>浏览和管理题目</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push("/questions")}>
                查看题库
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                历史记录
              </CardTitle>
              <CardDescription>查看您的面试历史</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push("/history")}>
                查看历史
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 最近的面试场次 */}
        <Card>
          <CardHeader>
            <CardTitle>最近的面试场次</CardTitle>
            <CardDescription>
              {loading ? "加载中..." : `共 ${sessions.length} 场面试`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                暂无面试记录
              </p>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div>
                      <h3 className="font-semibold">{session.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        状态: {session.status}
                      </p>
                    </div>
                    <Button
                      onClick={() => router.push(`/interviews/${session.id}`)}
                    >
                      查看详情
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

