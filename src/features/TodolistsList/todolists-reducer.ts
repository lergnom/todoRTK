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

export const removeTodolistTC = createAsyncThunk('todolists/removeTodolist', async (todolistId: string, {
    dispatch,
    rejectWithValue
}) => {
    try {
        dispatch(setAppStatusAC({status: 'loading'}));
        dispatch(changeTodolistEntityStatusAC({id: todolistId, status: 'loading'}));
        const res = await todolistsAPI.deleteTodolist(todolistId);
        dispatch(setAppStatusAC({status: 'succeeded'}));
        return {id: todolistId};
    } catch (e) {

    }
});
export const addTodolistTC = createAsyncThunk('todolists/addTodolist', async (title: string, {
    dispatch,
    rejectWithValue
}) => {
    dispatch(setAppStatusAC({status: 'loading'}));
    const res = await todolistsAPI.createTodolist(title);
    dispatch(setAppStatusAC({status: 'succeeded'}));
    return {todolist: res.data.data.item};
});

export const changeTodolistTitleTC = createAsyncThunk('todolists/changeTodolists', async (param: { id: string, title: string }, {
    dispatch,
    rejectWithValue
}) => {
    await todolistsAPI.updateTodolist(param.id, param.title);
    return {id: param.id, title: param.title};
});


const slice = createSlice({
    name: 'todolist',
    initialState: [] as Array<TodolistDomainType>,
    reducers: {
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
        builder.addCase(removeTodolistTC.fulfilled, (state, action) => {
            // @ts-ignore
            const index = state.findIndex(tl => tl.id === action.payload.id);
            if (index > -1) {
                state.splice(index, 1);
            }
        });
        builder.addCase(addTodolistTC.fulfilled, (state, action) => {
            state.unshift({...action.payload.todolist, filter: 'all', entityStatus: 'idle'});
        });
        builder.addCase(changeTodolistTitleTC.fulfilled, (state, action) => {
            const index = state.findIndex(tl => tl.id === action.payload.id);
            state[index].title = action.payload.title;
        });
    }
});

export const {
    changeTodolistEntityStatusAC,
    changeTodolistFilterAC
} = slice.actions;

export const todolistsReducer = slice.reducer;


// types
type ActionsType =
    | ReturnType<typeof changeTodolistFilterAC>
    | ReturnType<typeof changeTodolistEntityStatusAC>
export type FilterValuesType = 'all' | 'active' | 'completed';
export type TodolistDomainType = TodolistType & {
    filter: FilterValuesType
    entityStatus: RequestStatusType
}
type ThunkDispatch = Dispatch<ActionsType | ReturnType<typeof setAppStatusAC> | ReturnType<typeof setAppErrorAC>>
