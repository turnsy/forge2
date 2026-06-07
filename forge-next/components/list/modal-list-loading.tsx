import { Spinner } from "@/components/ui/spinner";

export function ModalListLoading() {
  return (
    <div className="flex min-h-[12rem] items-center justify-center py-10">
      <Spinner />
    </div>
  );
}
