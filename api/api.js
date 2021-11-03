var projectModel = require('../models/Project');
var taskModel = require('../models/Task')

async function userProjects(ownerId) {

    var allProjects = []
    var projects = await projectModel.find({ 'owner': ownerId })
    var partOfProjects = await projectModel.find({ 'teamMembers.uid': ownerId })

    for (project of projects) {
        var obj = projectDetails(project._id)
        var ob = await obj
        var Project = ob.project
        allProjects.push(Project)
    }

    for (project of partOfProjects) {
        var obj = projectDetails(project._id)
        var ob = await obj
        var Project = ob.project
        var bool = false
        for (i = 0; i < allProjects.length; i++) {
            var p = allProjects[i]
            if (Project.overview == p.overview) {
                var bool = true
            }
        }
        if (bool == true) {
            continue
        } else {
            allProjects.push(Project)
        }
    }

    //console.log(allClasses[0].studentDetails)

    return allProjects
}

async function projectDetails(projectId) {

    var project = await projectModel.findById(projectId)

    var ob = projectTasks(projectId);
    if (ob) {
        var tasks = await ob;

        var numberOfTasks = tasks.length;

        var completedTasks = await taskModel.find({ 'taskStatus': 'Complete' })
        //console.log(tasks)
        var completion = (completedTasks.length / numberOfTasks) * 100;

        if (completion >= 100) {
            project.status = 'Complete'
        }

        project.completion = completion;
    } else {
        project.status = 'On-Going';
        project.completion = 0;
    }

    var obj = { project: project }

    return obj

}

async function projectTasks(projectId) {
    var allTasks = []
    var tasks = await taskModel.find({ project: projectId })

    for (task of tasks) {
        var obj = taskDetails(task._id)
        var ob = await obj
        var task = ob.task
        allTasks.push(task)
    }

    return allTasks;
}

async function taskDetails(taskId) {

    var task = await taskModel.findById(taskId)


    var obj = { task: task }

    return obj

}

function containsObject(obj, list) {
    var x;
    for (x in list) {
        if (list.hasOwnProperty(x) && list[x] === obj) {
            return true;
        }
    }

    return false;
}

async function getUserDetails(userId, db, mongoose, projectId, bucket) {
    var a=[]
    
    const userRef = db.collection('users')
    var snap = await userRef.where('uid', '==', userId).get()
    snap.forEach(async user => {
        var user = user.data()
        var project = await projectModel.findOne({ _id: mongoose.Types.ObjectId(projectId) })
        var url = await bucket.file('users/' + user.uid + '/profile.jpg').getSignedUrl({
            action: 'read',
            expires: project.dueDate
        })
        var src = url[0];
        var obj = {}
        obj.name = user.name
        obj.uid = user.uid
        obj.src = src
        //console.log(obj)
        a.push(obj)
    })
    console.log(a)

}
module.exports = { projectDetails, userProjects, projectTasks, taskDetails, getUserDetails }