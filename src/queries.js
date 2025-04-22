import Todo from "./schema.js";

export const getTodos = async () => {
  try {
    const todos = await Todo.find();
    return todos;
  } catch (error) {
    console.error("Error fetching todos:", error);
    return;
  }
};

export const createTodo = async (title) => {
  try {
    const todo = await Todo.create({ title });
    return todo;
  } catch (error) {
    console.error("Error creating todo:", error);
    return null;
  }
};

export const updateTodo = async (title, updates) => {
  try {
    const updatedTodo = await Todo.findOneAndUpdate(
      { title },
      { $set: updates },
      { new: true }
    );
    return updatedTodo;
  } catch (error) {
    console.error("Error updating todo:", error);
    return null;
  }
};

export const deleteTodo = async (title) => {
  try {
    const todo = await Todo.findOneAndDelete({ title });
    return todo;
  } catch (error) {
    console.error("Error deleting todo:", error);
    return null;
  }
};
