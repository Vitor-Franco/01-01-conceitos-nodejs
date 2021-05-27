const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const userExists = users.find((user) => user.username === username);

  if (!userExists) {
    return response.status(404).json({ error: "User not exists!" });
  }

  request.user = userExists;
  return next();
}

app.post("/users", (request, response) => {
  const { name, username } = request.body;

  if (!name || !username) {
    return response.status(400).json({ error: "Required Username and Name" });
  }

  const verifyExistsAccountEvenUsername = users.find(
    (user) => user.username === username
  );

  if (verifyExistsAccountEvenUsername) {
    return response.status(400).json({ error: "Username already exists" });
  }

  const user = {
    id: uuidv4(),
    name,
    username,
    todos: [],
  };

  users.push(user);

  return response.status(201).json(user);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  return response.json(user.todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { user: userRequest } = request;
  const { title, deadline } = request.body;

  const handledDeadline = new Date(Date.parse(deadline)).toISOString();
  const newTodo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: handledDeadline,
    created_at: new Date().toISOString(),
  };

  userRequest.todos.push(newTodo);
  return response.status(201).json(newTodo);
});

app.put("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { title, deadline } = request.body;
  const { id } = request.params;

  const existsTodoID = user.todos.some((todo) => todo.id === id);
  if (!existsTodoID) {
    return response.status(404).json({ error: "Not Found." });
  }
  const updatedTodo = {
    deadline: new Date(Date.parse(deadline)).toISOString(),
    title,
    done: false,
  };

  const todosUpdated = user.todos.map((todo) => {
    if (todo.id === id) {
      return {
        ...todo,
        ...updatedTodo,
      };
    }
    return todo;
  });

  user.todos = todosUpdated;
  return response.json(updatedTodo);
});

app.patch("/todos/:id/done", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { id } = request.params;

  const existsTodoID = user.todos.some((todo) => todo.id === id);
  if (!existsTodoID) {
    return response.status(404).json({ error: "Not Found." });
  }

  const mappedTodos = user.todos.map((todo) => {
    if (todo.id === id) {
      return {
        ...todo,
        done: true,
      };
    }
    return todo;
  });

  user.todos = mappedTodos;
  return response.json(...mappedTodos);
});

app.delete("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { id } = request.params;

  const existsTodoID = user.todos.some((todo) => todo.id === id);
  if (!existsTodoID) {
    return response.status(404).json({ error: "Not Found." });
  }

  const todosWithoutDeletedTodo = user.todos.filter((todo) => todo.id !== id);
  user.todos = todosWithoutDeletedTodo;
  return response.status(204).send();
});

module.exports = app;
