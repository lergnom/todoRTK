import {todolistsAPI, TodolistType} from '../../api/todolists-api';
import {Dispatch} from 'redux';
import {RequestStatusType, setAppErrorAC, setAppStatusAC} from '../../app/app-reducer';
import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit";


// thunks

export const fetchTodolistsTC = createAsyncThunk('todolists/fetchTodolists', async (arg, {
    dispatch,
    rejectWithValue
}) => {
    try {
        const res = await todolistsAPI.getTodolists();
        if (res.status === 200) {
            return res.data;
        } else {
            return rejectWithValue(null);

        }
    } catch (e) {
        return rejectWithValue(e);
    } finally {
        dispatch(setAppStatusAC({status: 'succeeded'}));
    }
});

export const removeTodolistTC = (todolistId: string) => {
    return (dispatch: ThunkDispatch) => {
        //изменим глобальный статус приложения, чтобы вверху полоса побежала
        dispatch(setAppStatusAC({status: 'loading'}));
        //изменим статус конкретного тудулиста, чтобы он мог задизеблить что надо
        dispatch(changeTodolistEntityStatusAC({id: todolistId, status: 'loading'}));
        todolistsAPI.deleteTodolist(todolistId)
            .then((res) => {
                dispatch(removeTodolistAC({id: todolistId}));
                //скажем глобально приложению, что асинхронная операция завершена
                dispatch(setAppStatusAC({status: 'succeeded'}));
            });
    };
};
export const addTodolistTC = (title: string) => {
    return (dispatch: ThunkDispatch) => {
        dispatch(setAppStatusAC({status: 'loading'}));
        todolistsAPI.createTodolist(title)
            .then((res) => {
                dispatch(addTodolistAC({todolist: res.data.data.item}));
                dispatch(setAppStatusAC({status: 'succeeded'}));
            });
    };
};
export const changeTodolistTitleTC = (id: string, title: string) => {
    return (dispatch: Dispatch<ActionsType>) => {
        todolistsAPI.updateTodolist(id, title)
            .then((res) => {
                dispatch(changeTodolistTitleAC({id, title}));
            });
    };
};

const slice = createSlice({
    name: 'todolist',
    initialState: [] as Array<TodolistDomainType>,
    reducers: {
        removeTodolistAC(state, action: PayloadAction<{ id: string }>) {
            const index = state.findIndex(tl => tl.id === action.payload.id);
            if (index > -1) {
                state.splice(index, 1);
            }
        },
        addTodolistAC(state, action: PayloadAction<{ todolist: TodolistType }>) {
            state.unshift({...action.payload.todolist, filter: 'all', entityStatus: 'idle'});
        },
        changeTodolistTitleAC(state, action: PayloadAction<{ id: string, title: string }>) {
            const index = state.findIndex(tl => tl.id === action.payload.id);
            state[index].title = action.payload.title;
        },
        changeTodolistFilterAC(state, action: PayloadAction<{ id: string, filter: FilterValuesType }>) {
            const index = state.findIndex(tl => tl.id === action.payload.id);
            state[index].filter = action.payload.filter;
        },
        changeTodolistEntityStatusAC(state, action: PayloadAction<{ id: string, status: RequestStatusType }>) {
            const index = state.findIndex(tl => tl.id === action.payload.id);
            state[index].entityStatus = action.payload.status;
        },
        setTodolistsAC(state, action: PayloadAction<{ todolists: Array<TodolistType> }>) {
            return action.payload.todolists.map(tl => ({...tl, filter: 'all', entityStatus: 'idle'}));
        },
    },
    extraReducers: builder => {
        builder.addCase(fetchTodolistsTC.fulfilled, (state, action) => {
            // @ts-ignore
            return action.payload.todolists.map(tl => ({...tl, filter: 'all', entityStatus: 'idle'}));
        });
    }
});

export const {
    changeTodolistEntityStatusAC,
    removeTodolistAC,
    addTodolistAC,
    changeTodolistTitleAC,
    changeTodolistFilterAC
} = slice.actions;

export const todolistsReducer = slice.reducer;


// types
export type AddTodolistActionType = ReturnType<typeof addTodolistAC>;
export type RemoveTodolistActionType = ReturnType<typeof removeTodolistAC>;
type ActionsType =
    | RemoveTodolistActionType
    | AddTodolistActionType
    | ReturnType<typeof changeTodolistTitleAC>
    | ReturnType<typeof changeTodolistFilterAC>
    | ReturnType<typeof changeTodolistEntityStatusAC>
export type FilterValuesType = 'all' | 'active' | 'completed';
export type TodolistDomainType = TodolistType & {
    filter: FilterValuesType
    entityStatus: RequestStatusType
}
type ThunkDispatch = Dispatch<ActionsType | ReturnType<typeof setAppStatusAC> | ReturnType<typeof setAppErrorAC>>
