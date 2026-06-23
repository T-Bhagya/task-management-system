const { EmailClient } = require('@azure/communication-email');

const connectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING;
const senderAddress = process.env.AZURE_SENDER_ADDRESS;

const hasAzureConfig = connectionString && senderAddress;

let emailClient = null;

if (hasAzureConfig) {
  emailClient = new EmailClient(connectionString);
  console.log('✉️ Azure Communication Services Email client initialized successfully!');
} else {
  console.warn(
    '\n⚠️ [WARNING]: Azure Email settings are missing from backend/.env.\n' +
    'Please add AZURE_COMMUNICATION_CONNECTION_STRING and AZURE_SENDER_ADDRESS to send real emails.\n' +
    'Falling back to Console Logging / Simulated Welcome Emails.\n'
  );
}

/**
 * Sends a real welcome email with a temporary password to a collaborator.
 * Falls back gracefully to console printing if Azure Email is not configured.
 */
async function sendTemporaryPasswordEmail(to, name, tempPassword) {
  if (!hasAzureConfig || !emailClient) {
    console.log('\n==================================================');
    console.log(`✉️ [SIMULATED EMAIL] Welcome to DoIT! Your Temporary Password`);
    console.log(`Body: Hello ${name}, your account has been created.`);
    console.log(`Use this temporary password to log in: ${tempPassword}`);
    console.log('Please change your password immediately upon logging in.');
    console.log('==================================================\n');
    return { message: 'Email logged to console (Azure Email not configured)' };
  }

  const emailMessage = {
    senderAddress: senderAddress,
    content: {
      subject: 'Welcome to DoIT! Your Temporary Password',
      plainText: `Hello ${name},\n\nYour collaborator account has been created successfully.\n\nUse this temporary password to log in: ${tempPassword}\n\nPlease change your password immediately upon logging in.\n\nBest regards,\nThe DoIT Team`,
      html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #1b5e55; font-size: 24px; margin: 0; font-weight: bold;">Welcome to DoIT!</h2>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Collaborative Task Management System</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 24px;" />
        <p style="font-size: 16px; line-height: 1.6;">Hello <strong>${name}</strong>,</p>
        <p style="font-size: 16px; line-height: 1.6;">Your team administrator has created a collaborator account for you on DoIT.</p>
        <p style="font-size: 16px; line-height: 1.6;">Please use the temporary password below to log in and set up your permanent password:</p>
        
        <div style="background-color: #ebf0f0; border: 1px dashed rgba(27, 94, 85, 0.3); border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
          <span style="font-family: monospace; font-size: 22px; font-weight: bold; color: #1b5e55; letter-spacing: 1.5px;">${tempPassword}</span>
        </div>
        
        <p style="font-size: 14px; line-height: 1.6; color: #ef4444; background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 6px; padding: 12px;">
          <strong>Security Notice:</strong> You will be prompted to reset this temporary password immediately upon your first login.
        </p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 14px; line-height: 1.6; color: #64748b; margin: 0;">
          Best regards,<br />
          <strong>The DoIT Team</strong>
        </p>
      </div>
      `,
    },
    recipients: {
      to: [
        {
          address: to,
        },
      ],
    },
  };

  try {
    const poller = await emailClient.beginSend(emailMessage);
    const response = await poller.pollUntilDone();
    console.log(`🚀 Real email sent to ${to} (Message ID: ${response.id})`);
    return response;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    throw error;
  }
}


/**
 * Sends an email to Admin(s) and Project Manager when a collaborator updates a task's status.
 */
async function sendTaskStatusUpdateEmail(to, recipientName, taskTitle, oldStatus, newStatus, updatedByName) {
  const statusColors = {
    TODO: '#64748b',
    IN_PROGRESS: '#d97706',
    COMPLETED: '#16a34a',
  };
  const statusLabels = { TODO: 'To Do', IN_PROGRESS: 'In Progress', COMPLETED: 'Completed' };
  const newColor = statusColors[newStatus] || '#1b5e55';
  const newLabel = statusLabels[newStatus] || newStatus;
  const oldLabel = statusLabels[oldStatus] || oldStatus;

  if (!hasAzureConfig || !emailClient) {
    console.log(`\n📋 [SIMULATED EMAIL] Task status update to ${to}: "${taskTitle}" → ${newLabel} by ${updatedByName}`);
    return;
  }

  const emailMessage = {
    senderAddress,
    content: {
      subject: `Task Status Updated: "${taskTitle}"`,
      plainText: `Hello ${recipientName},\n\n${updatedByName} updated the status of task "${taskTitle}" from ${oldLabel} to ${newLabel}.\n\nBest regards,\nThe DoIT Team`,
      html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #1b5e55; font-size: 24px; margin: 0; font-weight: bold;">Task Status Updated</h2>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">DoIT · Collaborative Task Management</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 24px;" />
        <p style="font-size: 16px; line-height: 1.6;">Hello <strong>${recipientName}</strong>,</p>
        <p style="font-size: 16px; line-height: 1.6;">
          <strong>${updatedByName}</strong> has updated the status of a task you are involved with:
        </p>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: bold; color: #1e293b;">📋 ${taskTitle}</p>
          <div style="display: flex; align-items: center; gap: 12px; font-size: 14px;">
            <span style="color: #64748b; background: #f1f5f9; padding: 4px 12px; border-radius: 20px;">${oldLabel}</span>
            <span style="color: #94a3b8;">→</span>
            <span style="color: ${newColor}; background-color: ${newColor}18; font-weight: bold; padding: 4px 12px; border-radius: 20px; border: 1px solid ${newColor}44;">${newLabel}</span>
          </div>
        </div>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 14px; color: #64748b; margin: 0;">Best regards,<br /><strong>The DoIT Team</strong></p>
      </div>`,
    },
    recipients: { to: [{ address: to }] },
  };

  try {
    const poller = await emailClient.beginSend(emailMessage);
    await poller.pollUntilDone();
    console.log(`📋 Task status email sent to ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send task status email to ${to}:`, error.message);
  }
}

/**
 * Sends an email to a Project Manager when they are assigned to a project.
 */
async function sendProjectAssignedEmail(to, managerName, projectName, projectDescription, adminName) {
  if (!hasAzureConfig || !emailClient) {
    console.log(`\n📁 [SIMULATED EMAIL] Project assigned to ${to}: "${projectName}" by ${adminName}`);
    return;
  }

  const emailMessage = {
    senderAddress,
    content: {
      subject: `You've been assigned to project: "${projectName}"`,
      plainText: `Hello ${managerName},\n\n${adminName} has assigned you as the Project Manager for "${projectName}".\n\n${projectDescription ? `Description: ${projectDescription}` : ''}\n\nLog in to view your project and get started.\n\nBest regards,\nThe DoIT Team`,
      html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #1b5e55; font-size: 24px; margin: 0; font-weight: bold;">New Project Assigned! 🎉</h2>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">DoIT · Collaborative Task Management</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 24px;" />
        <p style="font-size: 16px; line-height: 1.6;">Hello <strong>${managerName}</strong>,</p>
        <p style="font-size: 16px; line-height: 1.6;">
          <strong>${adminName}</strong> has assigned you as the <strong>Project Manager</strong> for a new project:
        </p>
        <div style="background: linear-gradient(135deg, #ebf0f0 0%, #f0fdf4 100%); border: 1px solid rgba(27,94,85,0.2); border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; font-size: 20px; font-weight: bold; color: #1b5e55;">📁 ${projectName}</p>
          ${projectDescription ? `<p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.6;">${projectDescription}</p>` : ''}
        </div>
        <p style="font-size: 15px; line-height: 1.6; color: #475569;">
          Log in to DoIT to view your project dashboard, assign tasks, and manage your team.
        </p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 14px; color: #64748b; margin: 0;">Best regards,<br /><strong>The DoIT Team</strong></p>
      </div>`,
    },
    recipients: { to: [{ address: to }] },
  };

  try {
    const poller = await emailClient.beginSend(emailMessage);
    await poller.pollUntilDone();
    console.log(`📁 Project assignment email sent to ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send project assignment email to ${to}:`, error.message);
  }
}

/**
 * Sends an email to a user who was @mentioned in a comment.
 */
async function sendCommentMentionEmail(to, mentionedName, commenterName, taskTitle, commentText) {
  if (!hasAzureConfig || !emailClient) {
    console.log(`\n💬 [SIMULATED EMAIL] @mention email to ${to}: mentioned by ${commenterName} on task "${taskTitle}"`);
    return;
  }

  const emailMessage = {
    senderAddress,
    content: {
      subject: `You were mentioned in a comment on "${taskTitle}"`,
      plainText: `Hello ${mentionedName},\n\n${commenterName} mentioned you in a comment on task "${taskTitle}":\n\n"${commentText}"\n\nLog in to view the full task and reply.\n\nBest regards,\nThe DoIT Team`,
      html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #1b5e55; font-size: 24px; margin: 0; font-weight: bold;">You Were Mentioned 💬</h2>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">DoIT · Collaborative Task Management</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 24px;" />
        <p style="font-size: 16px; line-height: 1.6;">Hello <strong>${mentionedName}</strong>,</p>
        <p style="font-size: 16px; line-height: 1.6;">
          <strong>${commenterName}</strong> mentioned you in a comment on task <strong>"${taskTitle}"</strong>:
        </p>
        <div style="background-color: #f8fafc; border-left: 4px solid #1b5e55; border-radius: 4px; padding: 16px 20px; margin: 20px 0; font-size: 15px; color: #334155; line-height: 1.7; font-style: italic;">
          "${commentText}"
        </div>
        <p style="font-size: 15px; line-height: 1.6; color: #475569;">
          Log in to DoIT to view the full conversation and reply.
        </p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 14px; color: #64748b; margin: 0;">Best regards,<br /><strong>The DoIT Team</strong></p>
      </div>`,
    },
    recipients: { to: [{ address: to }] },
  };

  try {
    const poller = await emailClient.beginSend(emailMessage);
    await poller.pollUntilDone();
    console.log(`💬 Mention email sent to ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send mention email to ${to}:`, error.message);
  }
}

/**
 * Sends an email to a user when a task is assigned to them.
 */
async function sendTaskAssignedEmail(to, assigneeName, taskTitle, projectName, priority, dueDate, assignedByName) {
  const priorityColors = { HIGH: '#dc2626', MEDIUM: '#d97706', LOW: '#16a34a' };
  const priorityBg    = { HIGH: '#fef2f2', MEDIUM: '#fffbeb', LOW: '#f0fdf4' };
  const prioColor = priorityColors[priority] || '#64748b';
  const prioBg    = priorityBg[priority]    || '#f8fafc';
  const dueDateStr = dueDate ? new Date(dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null;

  if (!hasAzureConfig || !emailClient) {
    console.log(`\n✅ [SIMULATED EMAIL] Task assigned to ${to}: "${taskTitle}" in project "${projectName}" by ${assignedByName}`);
    return;
  }

  const emailMessage = {
    senderAddress,
    content: {
      subject: `New Task Assigned: "${taskTitle}"`,
      plainText: `Hello ${assigneeName},\n\n${assignedByName} has assigned you a new task: "${taskTitle}" in project "${projectName}".\nPriority: ${priority}\n${dueDateStr ? `Due: ${dueDateStr}` : ''}\n\nLog in to view your task.\n\nBest regards,\nThe DoIT Team`,
      html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #1b5e55; font-size: 24px; margin: 0; font-weight: bold;">New Task Assigned 📋</h2>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">DoIT · Collaborative Task Management</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 24px;" />
        <p style="font-size: 16px; line-height: 1.6;">Hello <strong>${assigneeName}</strong>,</p>
        <p style="font-size: 16px; line-height: 1.6;">
          <strong>${assignedByName}</strong> has assigned you a new task. Here are the details:
        </p>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold; color: #1e293b;">📋 ${taskTitle}</p>
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b;">
            <strong style="color: #475569;">Project:</strong> ${projectName}
          </p>
          <p style="margin: 0 0 8px 0; font-size: 14px;">
            <strong style="color: #475569;">Priority:</strong>
            <span style="color: ${prioColor}; background-color: ${prioBg}; padding: 2px 10px; border-radius: 20px; font-weight: bold; font-size: 13px;">${priority}</span>
          </p>
          ${dueDateStr ? `<p style="margin: 0; font-size: 14px; color: #64748b;"><strong style="color: #475569;">Due Date:</strong> ${dueDateStr}</p>` : ''}
        </div>
        <p style="font-size: 15px; line-height: 1.6; color: #475569;">
          Log in to DoIT to view your task details and get started.
        </p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 14px; color: #64748b; margin: 0;">Best regards,<br /><strong>The DoIT Team</strong></p>
      </div>`,
    },
    recipients: { to: [{ address: to }] },
  };

  try {
    const poller = await emailClient.beginSend(emailMessage);
    await poller.pollUntilDone();
    console.log(`✅ Task assignment email sent to ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send task assignment email to ${to}:`, error.message);
  }
}

/**
 * Sends a welcome email to a collaborator added to a project.
 */
async function sendProjectMemberWelcomeEmail(to, memberName, projectName, projectDescription, addedByName) {
  if (!hasAzureConfig || !emailClient) {
    console.log(`\n👥 [SIMULATED EMAIL] Project welcome to ${to}: added to "${projectName}" by ${addedByName}`);
    return;
  }

  const emailMessage = {
    senderAddress,
    content: {
      subject: `You've been added to project: "${projectName}"`,
      plainText: `Hello ${memberName},\n\n${addedByName} has added you as a collaborator on project "${projectName}".\n\n${projectDescription ? `Description: ${projectDescription}` : ''}\n\nLog in to view your project and start collaborating.\n\nBest regards,\nThe DoIT Team`,
      html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #1b5e55; font-size: 24px; margin: 0; font-weight: bold;">Welcome to the Project! 👥</h2>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">DoIT · Collaborative Task Management</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 24px;" />
        <p style="font-size: 16px; line-height: 1.6;">Hello <strong>${memberName}</strong>,</p>
        <p style="font-size: 16px; line-height: 1.6;">
          <strong>${addedByName}</strong> has added you as a <strong>Collaborator</strong> on the following project:
        </p>
        <div style="background: linear-gradient(135deg, #ebf0f0 0%, #f0fdf4 100%); border: 1px solid rgba(27,94,85,0.2); border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; font-size: 20px; font-weight: bold; color: #1b5e55;">📁 ${projectName}</p>
          ${projectDescription ? `<p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.6;">${projectDescription}</p>` : '<p style="margin: 0; font-size: 14px; color: #94a3b8; font-style: italic;">No description provided.</p>'}
        </div>
        <p style="font-size: 15px; line-height: 1.6; color: #475569;">
          You can now view project tasks, update task statuses, and collaborate with your team. Log in to DoIT to get started.
        </p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 14px; color: #64748b; margin: 0;">Best regards,<br /><strong>The DoIT Team</strong></p>
      </div>`,
    },
    recipients: { to: [{ address: to }] },
  };

  try {
    const poller = await emailClient.beginSend(emailMessage);
    await poller.pollUntilDone();
    console.log(`👥 Project welcome email sent to ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send project welcome email to ${to}:`, error.message);
  }
}

module.exports = {
  sendTemporaryPasswordEmail,
  sendTaskStatusUpdateEmail,
  sendProjectAssignedEmail,
  sendCommentMentionEmail,
  sendTaskAssignedEmail,
  sendProjectMemberWelcomeEmail,
};
