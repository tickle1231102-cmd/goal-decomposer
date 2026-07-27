"use client";

import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { GoalScope } from "@/lib/schematic";

const SCOPE_OPTIONS: { value: GoalScope; label: string }[] = [
  { value: "SHORT_TERM", label: "단기 (1-3개월)" },
  { value: "MID_TERM", label: "중기 (3-6개월)" },
  { value: "LONG_TERM", label: "장기 (1년 이상)" },
];

type GeneratePlanResponse = {
  data?: {
    id: string;
  };
  error?: {
    message?: string;
    code?: string;
  };
};

function toDateString(date: Date | undefined): string | undefined {
  return date ? format(date, "yyyy-MM-dd") : undefined;
}

function DatePickerField({
  id,
  label,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  id: string;
  label: string;
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  disabled?: boolean;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="size-4" />
            {value ? format(value, "yyyy-MM-dd") : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={value} onSelect={onChange} />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function GoalForm() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scope, setScope] = useState<GoalScope | "">("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (title.trim().length < 2) {
      setError("목표 타이틀은 2자 이상 입력해주세요.");
      return;
    }

    if (!scope) {
      setError("목표 규모를 선택해주세요.");
      return;
    }

    if (!startDate || !endDate) {
      setError("시작일과 데드라인을 모두 선택해주세요.");
      return;
    }

    if (endDate < startDate) {
      setError("데드라인은 시작일 이후여야 합니다.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/plan/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          scope,
          startDate: toDateString(startDate),
          endDate: toDateString(endDate),
        }),
      });

      const result = (await response.json()) as GeneratePlanResponse;

      if (!response.ok || !result.data?.id) {
        throw new Error(
          result.error?.message ?? "액션플랜 생성에 실패했습니다.",
        );
      }

      router.push(`/goals/${result.data.id}`);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "액션플랜 생성에 실패했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle>목표 입력</CardTitle>
        <CardDescription>
          목표를 입력하면 AI가 연·월·주·일 단위 액션플랜으로 분해합니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">목표 타이틀</Label>
            <Input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="예: 토익 900점 달성"
              disabled={isLoading}
              required
              minLength={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">상세 설명</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="목표에 대한 배경, 현재 상태, 제약 조건 등을 입력하세요."
              disabled={isLoading}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="scope">목표 규모 (Scope)</Label>
            <Select
              value={scope}
              onValueChange={(value) => setScope(value as GoalScope)}
              disabled={isLoading}
            >
              <SelectTrigger id="scope" className="w-full">
                <SelectValue placeholder="목표 규모를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {SCOPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <DatePickerField
              id="startDate"
              label="시작일"
              value={startDate}
              onChange={setStartDate}
              disabled={isLoading}
              placeholder="시작일 선택"
            />
            <DatePickerField
              id="endDate"
              label="데드라인"
              value={endDate}
              onChange={setEndDate}
              disabled={isLoading}
              placeholder="데드라인 선택"
            />
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          {isLoading ? (
            <div className="flex items-center gap-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              <Loader2 className="size-5 shrink-0 animate-spin" />
              <span>AI가 연, 월, 주, 일간 액션플랜을 설계 중입니다...</span>
            </div>
          ) : null}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                생성 중...
              </>
            ) : (
              "AI 액션플랜 생성"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
