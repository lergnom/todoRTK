import {setAppStatusAC} from '../../app/app-reducer';
import {authAPI, FieldErrorType, LoginParamsType} from '../../api/todolists-api';
import {handleServerAppError} from '../../utils/error-utils';
import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit";
import {AxiosError} from "axios";

export const loginTC = createAsyncThunk<undefined, LoginParamsType, { rejectValue: { errors: Array<string>, fieldsErrors?: Array<FieldErrorType> } }>('auth/login', async (data: LoginParamsType, thunkAPI) => {
    thunkAPI.dispatch(setAppStatusAC({status: 'loading'}));
    try {
        const res = await authAPI.login(data);
        if (res.data.resultCode === 0) {
            return;
        } else {
            handleServerAppError(res.data, thunkAPI.dispatch);
            return thunkAPI.rejectWithValue({errors: res.data.messages, fieldsErrors: res.data.fieldsErrors});
        }

    } catch (err) {
        // @ts-ignore
        const error: AxiosError = err;
        // @ts-ignore
        handleServerAppError(error, thunkAPI.dispatch);
        return thunkAPI.rejectWithValue({errors: [error.message], fieldsErrors: undefined});

    } finally {
        thunkAPI.dispatch(setAppStatusAC({status: 'succeeded'}));
    }

});

export const logoutTC = createAsyncThunk('auth/logout', async (arg, thunkAPI) => {
        thunkAPI.dispatch(setAppStatusAC({status: 'loading'}));
        try {
            const res = await authAPI.logout();
            if (res.data.resultCode === 0) {
                return;
            } else {
                handleServerAppError(res.data, thunkAPI.dispatch);
                return thunkAPI.rejectWithValue({});
            }
        } catch (e) {
            // @ts-ignore
            handleServerAppError(e, thunkAPI.dispatch);
            return thunkAPI.rejectWithValue({});

        } finally {
            thunkAPI.dispatch(setAppStatusAC({status: 'succeeded'}));
        }
    }
);

const slice = createSlice({
    name: 'auth',
    initialState: {
        isLoggedIn: false
    },
    reducers: {
        setIsLoggedInAC(state, action: PayloadAction<{ value: boolean }>) {
            state.isLoggedIn = action.payload.value;
        }
    },
    extraReducers: builder => {
        builder.addCase(loginTC.fulfilled, (state) => {
            state.isLoggedIn = true;
        });
        builder.addCase(logoutTC.fulfilled, (state) => {
                state.isLoggedIn = false;
            }
        );
    }
});

export const authReducer = slice.reducer;
export const {setIsLoggedInAC} = slice.actions;



