import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const entries = await prisma.entry.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { lastName, firstName, birthDate } = body;

  if (
    typeof lastName !== "string" ||
    typeof firstName !== "string" ||
    typeof birthDate !== "string" ||
    !lastName.trim() ||
    !firstName.trim() ||
    Number.isNaN(Date.parse(birthDate))
  ) {
    return NextResponse.json(
      { error: "入力内容が不正です。" },
      { status: 400 }
    );
  }

  const entry = await prisma.entry.create({
    data: {
      lastName: lastName.trim(),
      firstName: firstName.trim(),
      birthDate: new Date(birthDate),
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
