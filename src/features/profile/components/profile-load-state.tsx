import { View } from "react-native";

import { useAppTheme } from "@/shared/theme/use-app-theme";
import { ContentState } from "@/shared/ui/content-state";
import { ScreenContainer } from "@/shared/ui/screen-container";
import { Skeleton, SkeletonGroup } from "@/shared/ui/skeleton";

type ProfileLoadStateProps =
  | Readonly<{ status: "loading" }>
  | Readonly<{
      message: string;
      onRetry: () => void;
      retrying: boolean;
      status: "error";
    }>
  | Readonly<{ message: string; status: "session-expired" }>;

export function ProfileLoadState(props: ProfileLoadStateProps) {
  const theme = useAppTheme();

  if (props.status === "loading") {
    return (
      <ScreenContainer>
        <SkeletonGroup label="Đang tải hồ sơ cá nhân" style={{ gap: theme.spacing.lg }}>
          <Skeleton height={32} width="65%" />
          {[0, 1, 2].map((index) => (
            <View key={index} style={{ gap: theme.spacing.sm }}>
              <Skeleton height={24} width="45%" />
              <Skeleton height={52} />
              <Skeleton height={24} width="80%" />
            </View>
          ))}
        </SkeletonGroup>
      </ScreenContainer>
    );
  }

  if (props.status === "error") {
    return (
      <ScreenContainer>
        <ContentState
          actionLabel="Thử lại"
          actionLoading={props.retrying}
          description={props.message}
          onAction={props.onRetry}
          title="Chưa tải được hồ sơ"
          variant="error"
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ContentState
        description={props.message}
        title="Cần đăng nhập lại"
        variant="error"
      />
    </ScreenContainer>
  );
}
