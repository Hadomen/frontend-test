import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-10">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col gap-3">
          <Button
            render={<Link href="/register" />}
            nativeButton={false}
            className="w-full"
          >
            新規登録
          </Button>
          <Button
            render={<Link href="/list" />}
            nativeButton={false}
            variant="outline"
            className="w-full"
          >
            登録一覧を見る
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
