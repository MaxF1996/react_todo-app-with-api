import React, { useState, useEffect, useMemo } from 'react';
import { UserWarning } from './UserWarning';
import {
  getTodos,
  addTodo,
  deleteTodo,
  updateTodo,
  USER_ID,
} from './api/todos';
import { Todo } from './types/Todo';
import { Filters } from './types/Filters';
import { Errors } from './types/Errors';
import { UpdateReasons } from './types/UpdateReasons';
import { useDelayedSetState } from './hooks/useDelayedSetState';
import { Header } from './blocks/Header';
import { Footer } from './blocks/Footer';
import { TodoList } from './components/TodoList';
import { ErrorNotification } from './components/ErrorNotification';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filteredTodos, setFilteredTodos] = useState<Todo[]>([]);
  const [currentError, setCurrentError] = useState<Errors | null>(null);
  const [currentFilter, setCurrentFilter] = useState<Filters>(Filters.all);
  const [title, setTitle] = useState<string>('');
  const [isNewTodoAdding, setIsNewTodoAdding] = useState<boolean>(false);
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [isAdded, setIsAdded] = useState<boolean | null>(false);
  const [todoIdsForRemoving, setTodoIdsForRemoving] = useState<number[] | null>(
    null,
  );
  const [isTodoDeleting, setIsTodoDeleting] = useState<boolean>(false);
  const [reasonForUpdate, setReasonForUpdate] = useState<UpdateReasons | null>(
    null,
  );
  const [typeOfStatusChange, setTypeOfStatusChange] = useState<boolean | null>(
    null,
  );
  const [idsForStatusChange, setIdsForStatusChange] = useState<number[] | []>(
    [],
  );

  useEffect(() => {
    getTodos()
      .then(setTodos)
      .catch(() => {
        setCurrentError(Errors.load);
      });
  }, []);

  useEffect(() => {
    setFilteredTodos(todos);
  }, [todos]);

  useDelayedSetState(currentError, setCurrentError);
  useDelayedSetState(isAdded, setIsAdded, false, 1000);

  useEffect(() => {
    if (!title) {
      return;
    }

    const newTodo = { id: 0, userId: USER_ID, title, completed: false };

    setIsNewTodoAdding(true);
    setTempTodo(newTodo);

    addTodo(title)
      .then((todo: Todo) => {
        setTodos([...todos, todo]);
        setIsAdded(true);
      })
      .catch(() => {
        setCurrentError(Errors.add);
      })
      .finally(() => {
        setIsNewTodoAdding(false);
        setTempTodo(null);
      });

    setTitle('');
    setIsAdded(false);
  }, [title]);

  const handleFilteredTodos = (filter: Filters) => {
    const { all, active, completed } = Filters;

    switch (filter) {
      case all:
        setFilteredTodos(todos);
        break;
      case active:
        setFilteredTodos(todos.filter(todo => !todo.completed));
        break;
      case completed:
        setFilteredTodos(todos.filter(todo => todo.completed));
        break;
    }
  };

  const onFilterChange = (filter: Filters) => {
    if (currentFilter === filter) {
      return;
    }

    setCurrentFilter(filter);

    handleFilteredTodos(filter);
  };

  const isAllCompleted = useMemo(() => {
    return filteredTodos.every(todo => todo.completed);
  }, [filteredTodos]);

  const uncompletedCount = useMemo(() => {
    return todos.reduce((acc, todo) => (todo.completed ? acc : acc + 1), 0);
  }, [todos]);

  const completedCount = useMemo(() => {
    return todos.length - uncompletedCount;
  }, [todos, uncompletedCount]);

  const uncompletedIds = useMemo(() => {
    return todos.filter(todo => !todo.completed).map(todo => todo.id);
  }, [todos]);

  const completedIds = useMemo(() => {
    return todos.filter(todo => todo.completed).map(todo => todo.id);
  }, [todos]);

  const clearCompleted = () => {
    setTodoIdsForRemoving(
      todos.filter(todo => todo.completed).map(todo => todo.id),
    );
    setIsTodoDeleting(true);
  };

  useEffect(() => {
    if (typeOfStatusChange === null) {
      return;
    }

    let idsForChange: number[] = idsForStatusChange;

    if (reasonForUpdate === UpdateReasons.allToggled) {
      idsForChange =
        typeOfStatusChange === true
          ? uncompletedIds
          : typeOfStatusChange === false
            ? completedIds
            : [];

      setIdsForStatusChange(idsForChange);
    }

    Promise.allSettled(
      idsForChange.map(id => {
        const updateData = { completed: typeOfStatusChange };

        return updateTodo(id, updateData).then(() => id);
      }),
    )
      .then(results => {
        const successfulUpdates = results
          .filter(result => result.status === 'fulfilled')
          .map(result => result.value);

        setTodos(t =>
          t.map(todo =>
            successfulUpdates.includes(todo.id)
              ? { ...todo, completed: typeOfStatusChange }
              : todo,
          ),
        );
        setFilteredTodos(todos);
        if (results.some(result => result.status === 'rejected')) {
          setCurrentError(Errors.update);
        }
      })
      .finally(() => {
        setIdsForStatusChange([]);
        setTypeOfStatusChange(null);
        setReasonForUpdate(null);
      });
  }, [typeOfStatusChange]);

  useEffect(() => {
    if (
      !isTodoDeleting ||
      !todoIdsForRemoving ||
      todoIdsForRemoving.length === 0
    ) {
      return;
    }

    Promise.allSettled(
      todoIdsForRemoving.map(todoId => deleteTodo(todoId).then(() => todoId)),
    )
      .then(results => {
        const successfulDeletes = results
          .filter(result => result.status === 'fulfilled')
          .map(result => result.value);

        setTodos(t => t.filter(todo => !successfulDeletes.includes(todo.id)));

        if (results.some(result => result.status === 'rejected')) {
          setCurrentError(Errors.delete);
        }
      })
      .finally(() => {
        setIsTodoDeleting(false);
        setTodoIdsForRemoving([]);
      });
  }, [isTodoDeleting, todoIdsForRemoving]);

  useEffect(() => {
    handleFilteredTodos(currentFilter);
  }, [todos, currentFilter]);

  if (!USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <Header
          todosCount={todos.length}
          isAllCompleted={isAllCompleted}
          setTitle={setTitle}
          setCurrentError={setCurrentError}
          isNewTodoAdding={isNewTodoAdding}
          isAdded={isAdded}
          currentError={currentError}
          isTodoDeleting={isTodoDeleting}
          setTypeOfStatusChange={setTypeOfStatusChange}
          setReasonForUpdate={setReasonForUpdate}
        />

        <TodoList
          filteredTodos={filteredTodos}
          loadingTodo={tempTodo}
          isNewTodoAdding={isNewTodoAdding}
          isTodoDeleting={isTodoDeleting}
          setIsTodoDeleting={setIsTodoDeleting}
          todoIdsForRemoving={todoIdsForRemoving}
          setTodoIdsForRemoving={setTodoIdsForRemoving}
          setReasonForUpdate={setReasonForUpdate}
          idsForStatusChange={idsForStatusChange}
          setIdsForStatusChange={setIdsForStatusChange}
          setTypeOfStatusChange={setTypeOfStatusChange}
        />

        {/* Hide the footer if there are no todos */}
        {todos.length > 0 && (
          <Footer
            uncompletedCount={uncompletedCount}
            completedCount={completedCount}
            currentFilter={currentFilter}
            onFilterChange={onFilterChange}
            clearCompleted={clearCompleted}
          />
        )}
      </div>

      {/* DON'T use conditional rendering to hide the notification */}
      {/* Add the 'hidden' class to hide the message smoothly */}
      <ErrorNotification currentError={currentError} />
    </div>
  );
};
