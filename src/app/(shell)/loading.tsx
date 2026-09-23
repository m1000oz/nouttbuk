import { NotebookLoader } from "@/components/brand/notebook-loader";

export default function ShellLoading() {
  return (
    <div className="flex min-h-[calc(100vh-12rem)] w-full items-center justify-center">
      <NotebookLoader fullScreen={false} size="lg" mode="cycle" />
    </div>
  );
}
