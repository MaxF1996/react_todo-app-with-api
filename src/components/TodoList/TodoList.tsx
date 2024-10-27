import { Todo } from '../../types/Todo';
import { UpdateReasons } from '../../types/UpdateReasons';
import { TodoItem } from '../TodoItem';

type Props = {
  filteredTodos: Todo[];
  isNewTodoAdding: boolean;
  loadingTodo: Todo | null;
  todoIdsForRemoving: number[] | null;
  isTodoDeleting: boolean;
  setIsTodoDeleting: (isTodoDeleting: boolean) => void;
  setTodoIdsForRemoving: (id: number[] | null) => void;
  idsForStatusChange: number[];
  setReasonForUpdate: (reason: UpdateReasons | null) => void;
  setIdsForStatusChange: (idsForStatusChange: number[]) => void;
  setTypeOfStatusChange: (statusChanging: boolean | null) => void;
};

export const TodoList: React.FC<Props> = ({
  filteredTodos,
  isNewTodoAdding,
  loadingTodo,
  todoIdsForRemoving,
  isTodoDeleting,
  setTodoIdsForRemoving,
  setIsTodoDeleting,
  idsForStatusChange,
  setReasonForUpdate,
  setIdsForStatusChange,
  setTypeOfStatusChange,
}) => {
  return (
    <section className="todoapp__main" data-cy="TodoList">
      {filteredTodos.map(todo => (
        <TodoItem
          key={todo.id}
          todo={todo}
          isTodoDeleting={isTodoDeleting}
          setIsTodoDeleting={setIsTodoDeleting}
          todoIdsForRemoving={todoIdsForRemoving}
          setTodoIdsForRemoving={setTodoIdsForRemoving}
          idsForStatusChange={idsForStatusChange}
          setReasonForUpdate={setReasonForUpdate}
          setIdsForStatusChange={setIdsForStatusChange}
          setTypeOfStatusChange={setTypeOfStatusChange}
        />
      ))}

      {isNewTodoAdding && (
        <TodoItem
          key={loadingTodo!.id}
          todo={loadingTodo!}
          isNewTodoAdding={isNewTodoAdding}
          todoIdsForRemoving={todoIdsForRemoving}
          idsForStatusChange={idsForStatusChange}
          setIdsForStatusChange={setIdsForStatusChange}
          setReasonForUpdate={setReasonForUpdate}
          setTypeOfStatusChange={setTypeOfStatusChange}
        />
      )}
    </section>
  );
};
