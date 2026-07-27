"use client";

import { format } from "date-fns";
import { CalendarIcon, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { WEEKDAY_LABELS_KO } from "@/lib/week-utils";

const SCOPE_OPTIONS: { value: GoalScope; label: string }[] = [
  { value: "SHORT_TERM", label: "단기 (1-3개월)" },
  { value: "MID_TERM", label: "중기 (3-6개월)" },
  { value: "LONG_TERM", label: "장기 (1년 이상)" },
];

const WEEKDAY_OPTIONS = [
  { value: 1, label: WEEKDAY_LABELS_KO[1] },
  { value: 2, label: WEEKDAY_LABELS_KO[2] },
  { value: 3, label: WEEKDAY_LABELS_KO[3] },
  { value: 4, label: WEEKDAY_LABELS_KO[4] },
  { value: 5, label: WEEKDAY_LABELS_KO[5] },
  { value: 6, label: WEEKDAY_LABELS_KO[6] },
  { value: 0, label: WEEKDAY_LABELS_KO[0] },
] as const;

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
  const [excludedWeekdays, setExcludedWeekdays] = useState<number[]>([]);
  const [excludedDates, setExcludedDates] = useState<string[]>([]);
  const [excludeDatePickerOpen, setExcludeDatePickerOpen] = useState(false);
  const [pendingExcludeDate, setPendingExcludeDate] = useState<
    Date | undefined
  >();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleExcludedWeekday(weekday: number) {
    setExcludedWeekdays((current) =>
      current.includes(weekday)
        ? current.filter((value) => value !== weekday)
        : [...current, weekday],
    );
  }

  function addExcludedDate(date?: Date) {
    const target = date ?? pendingExcludeDate;
    if (!target) {
      return;
    }

    const dateStr = format(target, "yyyy-MM-dd");

    if (startDate && target < startDate) {
      setError("제외할 날짜는 시작일 이후여야 합니다.");
      return;
    }

    if (endDate && target > endDate) {
      setError("제외할 날짜는 데드라인 이전이어야 합니다.");
      return;
    }

    if (excludedDates.includes(dateStr)) {
      setError("이미 추가된 날짜입니다.");
      return;
    }

    setExcludedDates((current) => [...current, dateStr].sort());
    setPendingExcludeDate(undefined);
    setExcludeDatePickerOpen(false);
    setError(null);
  }

  function removeExcludedDate(dateStr: string) {
    setExcludedDates((current) => current.filter((value) => value !== dateStr));
  }

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
          excludedWeekdays,
          excludedDates,
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

          <div className="space-y-4 rounded-lg border p-4">
            <div className="space-y-1">
              <Label>쉬는 날</Label>
              <p className="text-sm text-muted-foreground">
                선택한 요일과 날짜에는 일간 과제가 배정되지 않습니다.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">매주 쉬는 요일</p>
              <div className="flex flex-wrap gap-2">
                {WEEKDAY_OPTIONS.map(({ value, label }) => {
                  const checked = excludedWeekdays.includes(value);
                  return (
                    <label
                      key={value}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                        checked
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50",
                        isLoading && "pointer-events-none opacity-50",
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleExcludedWeekday(value)}
                        disabled={isLoading}
                      />
                      <span>{label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">특정 날짜 제외</p>
              <div className="flex flex-wrap gap-2">
                <Popover
                  open={excludeDatePickerOpen}
                  onOpenChange={setExcludeDatePickerOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isLoading || !startDate || !endDate}
                      className={cn(
                        "justify-start text-left font-normal",
                        !pendingExcludeDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="size-4" />
                      {pendingExcludeDate
                        ? format(pendingExcludeDate, "yyyy-MM-dd")
                        : "날짜 선택"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={pendingExcludeDate}
                      onSelect={setPendingExcludeDate}
                      disabled={(date) => {
                        if (!startDate || !endDate) {
                          return true;
                        }
                        return date < startDate || date > endDate;
                      }}
                      defaultMonth={startDate}
                    />
                  </PopoverContent>
                </Popover>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => addExcludedDate()}
                  disabled={isLoading || !pendingExcludeDate}
                >
                  추가
                </Button>
              </div>
              {!startDate || !endDate ? (
                <p className="text-xs text-muted-foreground">
                  시작일과 데드라인을 먼저 선택하세요.
                </p>
              ) : null}
              {excludedDates.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {excludedDates.map((dateStr) => (
                    <li key={dateStr}>
                      <Badge variant="secondary" className="gap-1 pr-1">
                        {dateStr}
                        <button
                          type="button"
                          disabled={isLoading}
                          aria-label={`${dateStr} 제외 취소`}
                          onClick={() => removeExcludedDate(dateStr)}
                          className="rounded-full p-0.5 hover:bg-muted-foreground/20 disabled:opacity-50"
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">
                  추가된 특정 제외 날짜가 없습니다.
                </p>
              )}
            </div>
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
