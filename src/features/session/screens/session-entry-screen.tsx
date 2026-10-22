import { Redirect } from "expo-router";
import { View } from "react-native";
import { sessionDestination } from "../domain/session-destination";
import { useMobileSession } from "../state/mobile-session-provider";
import { ContentState } from "@/shared/ui/content-state";
import { ScreenContainer } from "@/shared/ui/screen-container";
import { Skeleton, SkeletonGroup } from "@/shared/ui/skeleton";
import { AppButton } from "@/shared/ui/app-button";

export function SessionEntryScreen() {
  const { snapshot, store } = useMobileSession();
  const destination = sessionDestination(snapshot);
  if (destination) return <Redirect href={destination} />;

  return (
    <ScreenContainer contentStyle={{ justifyContent: "center" }}>
      {snapshot.status === "loading" ? (
        <SkeletonGroup label="Đang kiểm tra phiên đăng nhập">
          <View style={{ gap: 16 }}>
            <Skeleton height={32} width="60%" />
            <Skeleton height={80} />
            <Skeleton height={48} />
          </View>
        </SkeletonGroup>
      ) : (
        <>
          <ContentState
            title={store ? "Chưa thể tiếp tục" : "Chưa có kết nối dịch vụ"}
            description={
              snapshot.status === "error" && snapshot.reason === "offline"
                ? "Kiểm tra kết nối rồi thử lại. Bạn chưa bị đăng xuất."
                : "Không thể kiểm tra phiên lúc này. Vui lòng thử lại sau."
            }
            variant="error"
          />
          {store ? (
            <AppButton label="Thử lại" onPress={() => void store.bootstrap()} />
          ) : null}
          {store ? (
            <AppButton
              label="Đăng xuất trên thiết bị này"
              variant="ghost"
              onPress={() => void store.logout()}
            />
          ) : null}
        </>
      )}
    </ScreenContainer>
  );
}
