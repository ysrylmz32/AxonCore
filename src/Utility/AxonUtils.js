'use strict';

import Enums from './Enums';

/**
 * Utility Class for AxonCore
 *
 * AxonClient Specific methods
 * Internal uses + external
 * All methods useful for internal uses or AxonClient specific
 *
 * @author KhaaZ
 *
 * @class AxonUtils
 */
class AxonUtils {
    constructor(axon) {
        this._axon = axon;
    }

    //
    // ****** GETTER ******
    //

    get axon() {
        return this._axon;
    }

    get bot() {
        return this.axon.client;
    }

    get Template() {
        return this.axon.configs.template;
    }

    get Logger() {
        return this.axon.Logger;
    }

    get Utils() {
        return this.axon.Utils;
    }

    //
    // ****** MISC ******
    //

    /**
     * Triger an Axon Webhook
     * Works directly with axon._configs._tokens [GETTER: axon.webhooks]
     *
     * @param {String} type - Type of the webhook [status, loader, error, misc]
     * @param {Object} embed - embed object
     * @param {String} opt - optional string to use as bot username
     * @memberof AxonUtils
     */
    triggerWebhook(type, embed, opt) {
        if (this.axon.webhooks[type].id.length > 0 && this.axon.webhooks[type].token.length) {
            this.bot.executeWebhook(this.axon.webhooks[type].id, this.axon.webhooks[type].token, {
                username: opt ? opt : (`${type[0].toUpperCase() + type.slice(1)} - ${this.axon.client.user ? this.axon.client.user.username : ''}`),
                avatarURL: this.axon.client.user ? this.axon.client.user.avatarURL : null,
                embeds: [
                    embed,
                ],
            })
                .catch(err => {
                    this.axon.Logger.error('Webhook issue' + err);
                });
        }
    }

    //
    // ****** PERMISSIONS ******
    //

    /**
     * Check if the user has correct perm in targeted channel
     *
     * @param {Object<Channel>} channel - Channel object
     * @param {Array<String>} permissions - List of permissions to test
     * @param {Object<User>} [user=this.bot.user] - User to test | Default to bot
     * @returns {Boolean} true if user has permissions
     * @memberof AxonUtils
     */
    hasChannelPerms(channel, permissions, user = this.bot.user) {
        for (const perm of permissions) {
            if (!channel.permissionsOf(user.id).has(perm)) {
                return false;
            }
        }
        return true;
    }

    /**
     * List all missing perms for a user
     *
     * @param {Object<Member>} member
     * @param {Array<String>} [permissions=[]] - List of permissions to test
     * @returns {Array<String>} An array of missing permissions
     * @memberof AxonUtils
     */
    missingPerms(member, permissions = []) {
        const missing = [];
        for (const perm of permissions) {
            if (!member.permission.has(perm)) {
                missing.push(perm);
            }
        }
        return missing;
    }

    /**
     * Check if the member has correct perm to execute
     *
     * @param {Object<Member>} member - Member object
     * @param {Array<String>} permissions - List of permissions to test
     * @returns {Boolean} true if member has permissions
     * @memberof AxonUtils
     */
    hasPerms(member, permissions = []) {
        for (const perm of permissions) {
            if (!member.permission.has(perm)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Check if the user is bot owner
     *
     * @param {String} uID - the user ID
     * @returns {Boolean}
     * @memberof AxonUtils
     */
    isBotOwner(uID) {
        return this.axon.staff.owners.find(u => u === uID);
    }

    /**
     * Check if the user is bot admin
     *
     * @param {String} uID - the user ID
     * @returns {Boolean}
     * @memberof AxonUtils
     */
    isBotAdmin(uID) {
        return this.isBotOwner(uID) || this.axon.staff.admins.find(u => u === uID);
    }

    /**
     * Check if the user is bot staff
     *
     * @param {String} uID - the user ID
     * @returns {Boolean}
     * @memberof AxonUtils
     */
    isBotStaff(uID) {
        for (const rank in this.axon.staff) {
            if (rank.find(u => u === uID)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check is the user is an Admin
     *
     * @param {Object<Member>} member - The member object
     * @returns {Boolean} true if admin / false if not
     * @memberof Command
     */
    isAdmin(member) {
        for (const perm of Enums.adminPerms) {
            if (member.permission.has(perm)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if the user is a mod or higher (admins are always mod)
     *
     * @param {Object<Member>} member - the member object
     * @param {Object} guildConf - the guild Config from the DB
     * @returns {Boolean} true if user is a mod / false if not
     * @memberof Command
     */
    isMod(member, guildConf) {
        if (guildConf.modUsers.find(u => u === member.id)) {
            return true;
        }

        const roles = member.roles;
        for (const role of guildConf.modRoles) {
            if (roles.find(r => r === role)) {
                return true;
            }
        }

        return this.isAdmin(member);
    }

    //
    // ****** MESSAGES METHODS ******
    //

    /**
     * Send a message.
     * Check for bot permissions + message/embed length
     * Doesn't support file
     *
     * @param {Object<Channel>} channel - The channel Object
     * @param {Object|String} content - Message content, String or Embed Object
     * @param {Object}
     * @returns {Promise<Message?>}
     * @memberof Command
     */
    sendMessage(channel, content, options = {}) {
        if (channel.guild && !this.hasChannelPerms(channel, ['sendMessages'])) { // check if bot has sendMessage perm in the channel.
            this.Logger.verbose(`No sendMessage perms [${channel.guild.name} - ${channel.guild.name}]!`);
            return Promise.resolve();
        }

        if (content instanceof Object && content.embed) {
            if (channel.guild && !this.hasChannelPerms(channel, ['embedLinks'])) { // check if bot has embedPermission perm in the channel.
                this.Logger.verbose(`No embedLinks perms [${channel.guild.name} - ${channel.guild.name}]!`);
                return Promise.resolve();
            }

            if (content.content && content.content.length > 2000) {
                throw new Error('[MESSAGE]: content > 2000');
            }

            if (content.embed.length > 6000) {
                throw new Error('[MESSAGE-EMBED]: embed > 6000');
            }
            if (content.embed.description && content.embed.description.length > 2048) {
                throw new Error('[MESSAGE-EMBED]: description > 2048');
            }
            if (content.embed.title && content.embed.title.length > 256) {
                throw new Error('[MESSAGE-EMBED]: title > 256');
            }
            if (content.embed.author && content.embed.author.name && content.embed.author.name.length > 256) {
                throw new Error('[MESSAGE-EMBED]: author > 256');
            }
            if (content.embed.footer && content.embed.footer.text && content.embed.footer.text.length > 2048) {
                throw new Error('[MESSAGE-EMBED]: footer > 2048');
            }
            if (content.embed.fields) {
                if (content.embed.fields.length > 25) {
                    throw new Error('[MESSAGE-EMBED]: fields > 25');
                }
                for (const field in content.embed.fields) {
                    if (field.name > 256 || field.value > 1024) {
                        throw new Error('[MESSAGE-EMBED]: field: name > 256 ; value > 1024');
                    }
                }
            }
        } else if (typeof content === 'string' && content.length > 2000) {
            throw new Error('[MESSAGE]: content > 2000');
        }

        if (typeof content !== 'object' || content === null) {
            content = { content: '' + content };
        }
        content.disableEveryone = !!options.disableEveryone;

        return channel.createMessage(content)
            .then(message => {
                /** Delete the message automatically */
                if (message && options.delete) {
                    if (options.delay) {
                        this.Utils.sleep(options.delay).then(() => message.delete().catch(console.log));
                    } else {
                        message.delete().catch(console.log);
                    }
                }
                return message;
            });
    }

    /**
     * Edit a message
     * Check for bot permissions + message embed/length
     *
     * @param {Object<Message>} message - The message object to edit
     * @param {Object|String} content - Object (embed) or String
     * @returns {Promise<Message?>}
     * @memberof Command
     */
    editMessage(message, content) {
        if (!message || !content) {
            return Promise.resolve();
        }
        if (content instanceof Object) {
            if (message.channel.guild && !this.hasChannelPerms(message.channel, ['embedLinks'])) { // check if bot has embedLinks perm in the channel.
                this.Logger.verbose(`No embedLinks perms [${message.channel.guild.name} - ${message.channel.guild.name}]!`);
                return Promise.resolve();
            }

            if (content.content.length > 2000) {
                throw new Error('[MESSAGE]: content > 2000');
            }

            if (content.embed.length > 6000) {
                throw new Error('[MESSAGE-EMBED]: embed > 6000');
            }
            if (content.embed.description && content.embed.description.length > 2048) {
                throw new Error('[MESSAGE-EMBED]: description > 2048');
            }
            if (content.embed.title && content.embed.title.length > 256) {
                throw new Error('[MESSAGE-EMBED]: title > 256');
            }
            if (content.embed.author && content.embed.author.name && content.embed.author.name.length > 256) {
                throw new Error('[MESSAGE-EMBED]: author > 256');
            }
            if (content.embed.footer && content.embed.footer.text && content.embed.footer.text.length > 2048) {
                throw new Error('[MESSAGE-EMBED]: footer > 2048');
            }
            if (content.embed.fields) {
                if (content.embed.fields.length > 25) {
                    throw new Error('[MESSAGE-EMBED]: fields > 25');
                }
                for (const field in content.embed.fields) {
                    if (field.name > 256 || field.value > 1024) {
                        throw new Error('[MESSAGE-EMBED]: field: name > 256 ; value > 1024');
                    }
                }
            }
        } else if (typeof content === 'string' && content.length > 2000) {
            throw new Error('[MESSAGE]: content > 2000');
        }

        return message.edit(content);
    }

    /**
     * DM targeted user if the bot is able to retrieve DM channel.
     * Reject promise if not
     *
     * @param {Object<User>} user - user object to get the DM channel
     * @param {Object|String} content - string or object (embed)
     * @param {Object} options - options object to pass to sendMessage
     * @returns
     * @memberof Command
     */
    sendDM(user, content, options) {
        return this.bot.getDMChannel(user.id)
            .then(chan => this.sendMessage(chan, content, options))
            .catch(this.Logger.verbose(`DM disabled/Bot blocked [${user.username}#${user.discriminator} - ${user.id}]!`));
    }

    /**
     * Send an error message. Add the error emote to the content
     * Check for sendMessage perms
     *
     * @param {Object<Channel>} channel - The channel Object
     * @param {String} content - error message content (String only)
     * @param {Object} options - options object to pass to sendMessage
     * @returns {Promise<Message?>}
     * @memberof Command
     */
    sendError(channel, content, options) {
        return this.sendMessage(channel, `${this.Template.emote.error} ${content}`, options);
    }

    /**
     * Send a success message. Add the success emote to the content
     * Check for sendMessage perms
     *
     * @param {Object<Channel>} channel - The channel Object
     * @param {String} content - error message content (String only)
     * @param {Object} options - options object to pass to sendMessage
     * @returns {Promise<Message?>}
     * @memberof Command
     */
    sendSuccess(channel, content, options) {
        return this.sendMessage(channel, `${this.Template.emote.success} ${content}`, options);
    }

    /**
     * Handle errors (send error message/log)
     * Call sendError
     *
     * @param {Object<Message>} msg - The message Object
     * @param {Object<Error>} err - The error message
     * @param {String} type - Type of error (api, db, internal)
     * @param {String} errMsg - optional error message
     * @returns {Promise}
     * @memberof Command
     */
    error(msg, err, type, errMsg) {
        const typeList = Enums.typeError;

        errMsg = errMsg || this.Template.message.error.general;
        this.sendError(msg.channel, errMsg);

        if (err) {
            err.message = `Type: ${typeList[type.toLowerCase()]} | ${err.message}`;
            throw err;
        }
        this.Logger.emerg(`Unexpected error [${msg.channel.guild.name} - ${msg.channale.guild.id}]!\n${err.stack}`);
    }
}


export default AxonUtils;
