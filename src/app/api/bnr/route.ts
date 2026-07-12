import { NextResponse } from "next/server";
import { getBnrRate } from "@/lib/bnr";

export async function GET() {
  const rate = await getBnrRate();
  return NextResponse.json({ rate });
}
