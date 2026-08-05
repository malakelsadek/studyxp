import { useAuth } from "../auth/AuthContext";
import { useSocketContext } from "../socket/SocketProvider";
import { updateProfile } from "../lib/api";

export function useCharacterEquip() {
  const { token, updateCharacter } = useAuth();
  const { socket } = useSocketContext();

  return function equipCharacter(characterId: string) {
    updateCharacter(characterId);
    socket?.emit("character:change", { character: characterId });
    if (token) {
      updateProfile(token, { character: characterId }).catch(() => {
        // cosmetic preference; not worth blocking the UI over a failed save
      });
    }
  };
}
