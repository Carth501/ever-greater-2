import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  loginThunk,
  logoutThunk,
  signupThunk,
} from "../store/slices/authSlice";

export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, isCheckingAuth, isLoading, error, errorCode, errorDetail } =
    useAppSelector((state) => state.auth);

  const login = (email: string, password: string) => {
    dispatch(loginThunk({ email, password }));
  };

  const logout = () => {
    dispatch(logoutThunk());
  };

  const signup = (email: string, password: string) => {
    dispatch(signupThunk({ email, password }));
  };

  return {
    user,
    isCheckingAuth,
    isLoading,
    error,
    errorCode,
    errorDetail,
    login,
    logout,
    signup,
  };
}
