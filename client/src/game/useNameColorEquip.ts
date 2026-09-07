import { useAuth } from "../auth/AuthContext";
import { useSocketContext } from "../socket/SocketProvider";
import { updateProfile } from "../lib/api";

export function useNameColorEquip() {
  const { token, updateNameColor } = useAuth();
  const { socket } = useSocketContext();

  return function equipNameColor(nameColor: string | null) {
    updateNameColor(nameColor);
    socket?.emit("nameColor:change", { nameColor });
    if (token) {
      updateProfile(token, { nameColor }).catch(() => {
        // cosmetic preference; not worth blocking the UI over a failed save
      });
    }
  };
}
