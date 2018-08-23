$(document).ready(function() {
  attachListeners();
});

const attachListeners = function() {
  $(function () {
    $(".task-more").on("click", function(){
      const id = $(this).data("id");
      showTask(id);
    })
  })

  $(function() {
    $(".project-more").on("click", function(){
      const projectId = $(this).data("projectId");
      renderTasks(projectId);
    })
  })

  $(function () {
    $(".new-task").on("click", function(){
      const projectId = $(this).data("project-id");
      showTaskForm(projectId)
    })
  })

  $(function () {
    $('#add-project').on('click', function(){
      createProject();
    })
  })

  $(function() {
    $('.projectDelete').on('click', function(event){
      const projectId = $(this).data("project-id");
      $.ajax({
        url: `projects/${projectId}`,
        type: 'DELETE'
      }).success(function(){
        location.reload();
      })
    })
  })
}

/////////////// JS Model Object //////////////

function Task(name, description, dueDate, user) {
  this.name = name;
  this.description = description;
  this.dueDate = dueDate;
  this.user = user;
}

Task.prototype.format = function(){
  return `
   <p>Description: ${this.description}</p>
   <p>Due Date: ${this.dueDate}
   <p>Assigned To: ${this.user}</p>
  `
}

/////////////////////////////////////////////



const createProject = function() {
  // show project form
  $.get('/projects/new',function(projectForm){
    $('#newProjectForm').html('<br>' + projectForm)

    $('#new_project').submit(function(event){
      event.preventDefault()
      const url = this.action;
      const values = $(this).serialize();
          // save project
      $.post(url, values).success(function(projectData){
        const projectId = projectData.id
        const projectName = projectData.name

        // refresh form
        $(`#newProjectForm`).find("form").get(0).reset()
        $(`#newProjectForm`).find("form").find("input[type=submit]").removeAttr('disabled');

        const projectHTML = projectTemplate(projectId, projectName)

            // render project

        $('#projects').append(projectHTML)

          $(".new-task").on("click", function(){
            const projectId = $(this).data("project-id");
            showTaskForm(projectId)
          })

          $('.projectDelete').on('click', function(event){
            const projectId = $(this).data("project-id");
            $.ajax({
              url: `projects/${projectId}`,
              type: 'DELETE'
            }).success(function(){
              location.reload();
            })
          })

      })




    })
  })



}

const projectTemplate = (projectId, projectName) => {
  return `
    <div class="col-sm-4 mb-3 ">
      <div id="project-${projectId}" class="col-md-12 bg-secondary pb-3 rounded">

      <br>
      <button type="button" data-project-id="${projectId}" class="project-more btn btn-primary text-center col-md-12 py-3 rounded btn">${projectName}</button>

        <div class="tasks">

        </div>

        <div id="newTaskForm-${projectId}" class="collapse">

        </div>

      <br><button type="button" class="new-task btn btn-dark m-1" data-project-id="${projectId}" data-toggle="collapse" data-target="#newTaskForm-${projectId}" aria-expanded="false" aria-controls="" >Add Task</button>

      <button type="button" id="projectDelete" class="btn btn-warning" data-project-id="${projectId}">Delete Project</button>

      </div>
    </div>
  `
}


// const renderProjects = () => {
//   $.get('/projects.json', function(projects){
//     for(const i of projects){
//
//       const projectHTML = projectTemplate(i.id, i.name)
//
//       $('#projects').append(projectHTML)
//       $(function() {
//         $(".project-more").on("click", function(){
//
//           const projectId = $(this).data("projectId");
//           renderTasks(projectId);
//         })
//       })
//       // append HTML to projects div
//     }
//   })
// }

const renderTasks = (projectId) => {
  $.get(`/projects/${projectId}`, function(projectData){
    // should this be a for each?
    let tasksHTML = ""
    for(const i of projectData){
      const name = i.name;
      const taskId = i.id;
      const button = buttonizeTask(name, taskId);

      tasksHTML += button
    }
    $(`#project-${projectId}`).find(".tasks").html(tasksHTML);
    $(".task-more").on("click", function(){
      const id = $(this).data("id");
      showTask(id);
    })
  })
}

const showTask = function (id) {

  $.get(`/tasks/${id}` ,function(taskData){
    // {id: 2, due_date: "2018-07-12T00:00:00.000Z", description: "Create command line design", user_id: 3, project_id: 3, …}
    let user = ""
    let formattedDueDate = ""
    let description = ""
    const name = taskData.name

    if (taskData.due_date){
      const dueDate = new Date(taskData.due_date)
      formattedDueDate = dueDate.toDateString()
    }
    if (taskData.user) { user = taskData.user.username}
    if (taskData.description) {description = taskData.description}


    const editButton = `<button type="button" id="edit-task" class="btn btn-primary" data-task-id="${taskData.id}">Edit Task</button>`


    const task = new Task(name, description, formattedDueDate, user)

    const taskHTML = task.format()

    // const modal = $(`#task-${taskData.id}`)
    $('.modal-title').html(name)
    $('.modal-body').html(taskHTML + editButton)

    $('#edit-task').on("click", function(){
      editTask($(this).data("taskId"));

    })

  })
}

const editTask = (taskId) => {
  $.get(`/tasks/${taskId}/edit`, function(response){
    $('.modal-body').html(response)

    $('.edit_task').on('submit', function(event){
      event.preventDefault();
      const url = this.action;
      const values = $(this).serialize();
      updateTask(url, values);
    })
  })
}

const updateTask = (url, values) => {
  $.ajax({
    type: 'PATCH',
    url: url,
    data: values
  }).success(function(response){
    showTask(response.id)
  })
}


const showTaskForm = function(projectId) {
  const formTemplate =   `
    <form class="taskForm" action="/projects/${projectId}/tasks" method="POST" data-project-id="<%= project.id %>">
        <input type"text" name="task[name]" value="">
        <input type="submit">
    </form>`

  $(`#newTaskForm-${projectId}`).html(formTemplate);

  $('.taskForm').on('submit', function(event){
    event.preventDefault();
    const url = this.action
    const values = $(this).serialize();


    $.post(url, values).success(function(response){

      const name = response.name;
      const projectId = response.project.id
      const taskId = response.id
      const button = buttonizeTask(name, taskId);

      $(`#project-${projectId}`).find(".tasks").append(button);

      // add new event listener for new task
      $(".task-more").on("click", function(){
        const id = $(this).data("id");
        showTask(id);
      })

      // refresh form
      $(`#project-${projectId}`).find("form").get(0).reset()
      $(`#project-${projectId}`).find("form").find("input[type=submit]").removeAttr('disabled');
    })
  })
}

const buttonizeTask = function(name, taskId) {
  return  `<button type="button" class="task-more btn btn-light m-1" data-id="${taskId}" name="button" data-toggle="modal" data-target=".modal" >${name}</button>`
}
