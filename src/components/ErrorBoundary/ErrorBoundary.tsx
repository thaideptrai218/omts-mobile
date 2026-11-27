import { Component, Fragment, type ReactNode } from "react";

/** Thông tin lỗi đưa cho màn thay thế. */
export type ErrorFallbackProps = {
  /**
   * Không tải được file mã của màn (mạng yếu, hoặc app vừa có bản mới). Trình duyệt nhớ lần tải hỏng này, nên vẽ lại
   * không giúp được: phải tải lại app.
   */
  chunk: boolean;
  /** Dựng lại phần đã lỗi từ đầu. */
  retry: () => void;
};

const CHUNK_ERROR = /dynamically imported module|importing a module script failed|error loading dynamically imported module|loading chunk/i;

function isChunkError(error: unknown): boolean {
  return CHUNK_ERROR.test(error instanceof Error ? `${error.name} ${error.message}` : String(error));
}

/**
 * Chặn lỗi khi vẽ một phần giao diện, để lỗi của một màn không làm trắng cả Mini App (Zalo coi màn trắng là vi phạm).
 * Chỉ bắt lỗi lúc vẽ; lỗi khi bấm nút hay gọi API vẫn do từng màn báo như cũ.
 */
export class ErrorBoundary extends Component<{ fallback: (props: ErrorFallbackProps) => ReactNode; children: ReactNode }, { error: unknown; attempt: number }> {
  state: { error: unknown; attempt: number } = { error: undefined, attempt: 0 };

  static getDerivedStateFromError(error: unknown) {
    return { error: error ?? new Error("Lỗi không rõ") };
  }

  // Đổi key để dựng lại phần đã lỗi từ đầu, không giữ trạng thái đã hỏng.
  private retry = () => this.setState((s) => ({ error: undefined, attempt: s.attempt + 1 }));

  render() {
    if (this.state.error !== undefined) return this.props.fallback({ chunk: isChunkError(this.state.error), retry: this.retry });
    return <Fragment key={this.state.attempt}>{this.props.children}</Fragment>;
  }
}
