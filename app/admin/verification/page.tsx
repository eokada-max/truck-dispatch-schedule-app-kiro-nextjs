'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { verifyDataLoaded, type DataVerificationResult } from '@/lib/api/verification';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function VerificationPage() {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<DataVerificationResult | null>(null);

  useEffect(() => {
    async function verify() {
      setLoading(true);
      const data = await verifyDataLoaded();
      setResult(data);
      setLoading(false);
    }
    verify();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-lg">データを確認中...</span>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="container mx-auto p-8">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">エラー</CardTitle>
            <CardDescription>データの確認に失敗しました</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const StatusIcon = ({ success }: { success: boolean }) => (
    success ? (
      <CheckCircle2 className="h-6 w-6 text-green-500" />
    ) : (
      <XCircle className="h-6 w-6 text-red-500" />
    )
  );

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">サンプルデータ検証</h1>
        <p className="text-gray-600">
          データベースに正しくサンプルデータが投入されているかを確認します
        </p>
      </div>

      {/* 全体の結果 */}
      <Card className={`mb-6 ${result.overall ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <StatusIcon success={result.overall} />
            <div>
              <CardTitle className={result.overall ? 'text-green-700' : 'text-yellow-700'}>
                {result.overall ? '✓ 全てのデータが正常に投入されています' : '⚠ 一部のデータが不足しています'}
              </CardTitle>
              <CardDescription>
                {result.overall 
                  ? 'サンプルデータの投入が完了しました。アプリケーションを使用できます。'
                  : 'sample_data.sqlを実行してサンプルデータを投入してください。'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 詳細結果 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* クライアント */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>クライアント</CardTitle>
              <StatusIcon success={result.clients.success} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">投入済み:</span>
                <span className="font-semibold">{result.clients.count}件</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">期待値:</span>
                <span className="font-semibold">{result.clients.expected}件</span>
              </div>
              {result.clients.data && result.clients.data.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">登録済みクライアント:</p>
                  <ul className="text-sm space-y-1">
                    {result.clients.data.map((client: any) => (
                      <li key={client.id} className="text-gray-700">• {client.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 協力会社 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>協力会社</CardTitle>
              <StatusIcon success={result.partnerCompanies.success} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">投入済み:</span>
                <span className="font-semibold">{result.partnerCompanies.count}件</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">期待値:</span>
                <span className="font-semibold">{result.partnerCompanies.expected}件</span>
              </div>
              {result.partnerCompanies.data && result.partnerCompanies.data.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">登録済み協力会社:</p>
                  <ul className="text-sm space-y-1">
                    {result.partnerCompanies.data.map((company: any) => (
                      <li key={company.id} className="text-gray-700">• {company.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ドライバー */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>ドライバー</CardTitle>
              <StatusIcon success={result.drivers.success} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">投入済み:</span>
                <span className="font-semibold">{result.drivers.count}件</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">期待値:</span>
                <span className="font-semibold">{result.drivers.expected}件</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">└ 自社:</span>
                <span>{result.drivers.inHouse}件</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">└ 協力会社:</span>
                <span>{result.drivers.partner}件</span>
              </div>
              {result.drivers.data && result.drivers.data.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">登録済みドライバー:</p>
                  <ul className="text-sm space-y-1">
                    {result.drivers.data.map((driver: any) => (
                      <li key={driver.id} className="text-gray-700">
                        • {driver.name} {driver.is_in_house ? '(自社)' : '(協力会社)'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* スケジュール */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>スケジュール</CardTitle>
              <StatusIcon success={result.schedules.success} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">投入済み:</span>
                <span className="font-semibold">{result.schedules.count}件</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">期待値:</span>
                <span className="font-semibold">{result.schedules.expected}件</span>
              </div>
              {result.schedules.data && result.schedules.data.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">今日から1週間分のスケジュール</p>
                  <p className="text-xs text-gray-500">
                    {result.schedules.count}件のスケジュールが登録されています
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 次のステップ */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>次のステップ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {!result.overall && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">サンプルデータの投入方法</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700">
                  <li>Supabase Dashboardにアクセス</li>
                  <li>SQL Editorを開く</li>
                  <li>supabase/sample_data.sqlの内容をコピー＆ペースト</li>
                  <li>Runボタンをクリックして実行</li>
                  <li>このページをリロードして確認</li>
                </ol>
              </div>
            )}
            {result.overall && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">✓ データ投入完了</h3>
                <p className="text-sm text-green-700 mb-3">
                  サンプルデータの投入が完了しました。以下のページで動作を確認できます。
                </p>
                <div className="space-y-2">
                  <a 
                    href="/schedules" 
                    className="block text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    → スケジュール管理ページで確認
                  </a>
                  <Link 
                    href="/" 
                    className="block text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    → トップページに戻る
                  </Link>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
