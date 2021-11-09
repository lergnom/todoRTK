import {addTodolistTC, fetchTodolistsTC, removeTodolistTC} from './todolists-reducer';
import {TaskPriorities, TaskStatuses, TaskType, todolistsAPI, UpdateTaskModelType} from '../../api/todolists-api';
import {AppRootStateType} from '../../app/store';
import {setAppStatusAC} from '../../app/app-reducer';
import {handleServerAppError, handleServerNetworkError} from '../../utils/error-utils';
import {createAsyncThunk, createSlice} from "@reduxjs/toolkit";

export const fetchTasks = createAsyncThunk('tasks/fetchTasks', async (todolistId: string, thunkAPI) => {
    thunkAPI.dispatch(setAppStatusAC({status: 'loading'}));
    const res = await todolistsAPI.getTasks(todolistId);
    thunkAPI.dispatch(setAppStatusAC({status: 'succeeded'}));
    const tasks = res.data.items;
    return {tasks, todolistId};
});

export const removeTaskTC = createAsyncThunk('tasks/removeTask', async (payload: { taskId: string, todolistId: string }, thunkAPI) => {
    await todolistsAPI.deleteTask(payload.todolistId, payload.taskId);
    return {taskId: payload.taskId, todolistId: payload.todolistId};

});

export const addTaskTC = createAsyncThunk('tasks/addTask', async (payload: { title: string, todolistId: string }, {
        dispatch,
        rejectWithValue
    }) => {
        dispatch(setAppStatusAC({status: 'loading'}));
        try {
            const res = await todolistsAPI.createTask(payload.todolistId, payload.title);
            if (res.data.resultCode === 0) {
                const task = res.data.data.item;
                dispatch(setAppStatusAC({status: 'succeeded'}));
                return {task};
            } else {
                return rejectWithValue(null);
            }

        } catch (e) {
            return rejectWithValue(null);
        }
    }
);

export const updateTaskTC = createAsyncThunk('tasks/updateTask', async (payload: { taskId: string, domainModel: UpdateDomainTaskModelType, todolistId: string }, {
    dispatch,
    rejectWithValue,
    getState
}) => {
    const state = getState() as AppRootStateType;
    const task = state.tasks[payload.todolistId].find(t => t.id === payload.taskId);
    if (!task) {
        return rejectWithValue('task not found in the state');
    }

    const apiModel: UpdateTaskModelType = {
        deadline: task.deadline,
        description: task.description,
        priority: task.priority,
        startDate: task.startDate,
        title: task.title,
        status: task.status,
        ...payload.domainModel
    };

    const res = await todolistsAPI.updateTask(payload.todolistId, payload.taskId, apiModel);

    try {
        if (res.data.resultCode === 0) {
            return payload;
        } else {
            handleServerAppError(res.data, dispatch);
            return rejectWithValue(null);
        }
    } catch (error) {
        // @ts-ignore
        handleServerNetworkError(error, dispatch);
        return rejectWithValue(null);
    }
    ;
});


const slice = createSlice({
    name: 'tasks',
    initialState: {} as TasksStateType,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(addTodolistTC.fulfilled, (state, action) => {
            state[action.payload.todolist.id] = [];
        });
        builder.addCase(removeTodolistTC.fulfilled, (state, action) => {
            // @ts-ignore
            delete state[action.payload.id];
        });
        builder.addCase(fetchTodolistsTC.fulfilled, (state, action) => {
            // @ts-ignore
            action.payload.todolists.forEach(tl => {
                state[tl.id] = [];
            });
        });
        builder.addCase(fetchTasks.fulfilled, (state, action) => {
            state[action.payload.todolistId] = action.payload.tasks;

        });
        builder.addCase(removeTaskTC.fulfilled, (state, action) => {
            const tasks = state[action.payload.todolistId];
            const index = tasks.findIndex(t => t.id === action.payload.taskId);
            if (index > -1) {
                tasks.splice(index, 1);
            }
        });
        builder.addCase(addTaskTC.fulfilled, (state, action) => {
            // @ts-ignore
            state[action.payload.task.todoListId].unshift(action.payload.task);
        });
        builder.addCase(updateTaskTC.fulfilled, (state, action) => {
            // @ts-ignore
            const tasks = state[action.payload.todolistId];
            // @ts-ignore
            const index = tasks.findIndex(t => t.id === action.payload.taskId);
            if (index > -1) {
                // @ts-ignore
                tasks[index] = {...tasks[index], ...action.payload.model};
            }
        });
    }

});

export const tasksReducer = slice.reducer;


// types
export type UpdateDomainTaskModelType = {
    title?: string
    description?: string
    status?: TaskStatuses
    priority?: TaskPriorities
    startDate?: string
    deadline?: string
}
export type TasksStateType = {
    [key: string]: Array<TaskType>
}
