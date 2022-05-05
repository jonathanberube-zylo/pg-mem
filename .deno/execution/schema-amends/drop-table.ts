import { _ISchema, _Transaction, _ISequence, _IStatementExecutor, _IStatement, asSeq, asIndex, _INamedIndex, _ITable, asTable } from '../../interfaces-private.ts';
import { DropTableStatement } from 'https://deno.land/x/pgsql_ast_parser@10.0.5/mod.ts';
import { ExecHelper } from '../exec-utils.ts';
import { ignore } from '../../utils.ts';

export class DropTable extends ExecHelper implements _IStatementExecutor {
    private table: _ITable | null;
    private cascade: boolean;


    constructor({ schema }: _IStatement, statement: DropTableStatement) {
        super(statement);

        this.table = asTable(schema.getObject(statement.name, {
            nullIfNotFound: statement.ifExists,
        }));

        this.cascade = statement.cascade === 'cascade';

        if (!this.table) {
            ignore(statement);
        }
    }

    execute(t: _Transaction) {
        // commit pending data before making changes
        //  (because it does not support further rollbacks)
        t = t.fullCommit();

        // drop table
        this.table?.drop(t, this.cascade);

        // new implicit transaction
        t = t.fork();

        return this.noData(t, 'DROP');
    }
}
