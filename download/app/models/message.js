import db from '../tools/db.js';
import Model from './model.js';

class Message extends Model {

    constructor() {
        super('messages',
            {
                id: null,
                data: null,
                emit_time: null,
                message: null,
                session: null,
                groupe_id: null
            });
    }

    async save() {
        // mandatory fields
        if (!this.fields.message) throw new Error('Message is required');
        if (this.fields.groupe_id == '') this.fields.groupe_id = null

        super.save();
    }

    async list(w) {
        if (w) {
            return await super.list(w)
        }
        return db(this.table)
    }

    async last(w) {
            return db(this.table)
                .orderBy("emit_time", "desc")
                .limit(1)
                .where(w)
    }
}


// Create Table if not exists
db.schema.hasTable('messages').then(exists => {
    if (!exists) {
        db.schema.createTable('messages', table => {
            table.increments('id').primary();
            table.string('data');
            table.integer('emit_time');
            table.string('message');
            table.integer('session_id')
            table.integer('group_id')

        }).then(() => {
            console.log('created messages table');
        });
    }
});

export default Message;