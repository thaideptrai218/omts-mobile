import { atom } from "jotai";

/** Máy đang có mạng hay không; cập nhật bởi `services/connectivityService.ts`. Mất mạng thì hiện MSG07. */
export const onlineAtom = atom(true);
