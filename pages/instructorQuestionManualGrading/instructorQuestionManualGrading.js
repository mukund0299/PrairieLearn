const ERR = require('async-stacktrace');
const express = require('express');
const router = express.Router();
const path = require('path');
const debug = require('debug')('prairielearn:' + path.basename(__filename, '.js'));
const { error, sqlDb} = require('@prairielearn/prairielib');

router.get('/', (req, res, next) => {
    const params = [res.locals.instance_question.id];
    sqlDb.callZeroOrOneRow('instance_question_select_manual_grading_objects', params, (err, result) => {
        if (ERR(err, next)) return;

        // FYI, Maja:
        // Use case 1: Student never loaded question (variant and submission is null)
        // Use case 2: Student loaded question but did not submit anything (submission is null)
        // Use case 3: Student has answered question (question, variant, submission are NOT null)
        // Other cases to figure out later: grading in progress, question is broken...

        res.locals['question'] = result.rows[0].question;
        res.locals['variant'] = result.rows[0].variant;
        res.locals['submission'] = result.rows[0].submission;
        res.render(__filename.replace(/\.js$/, '.ejs'), res.locals);
    });

    debug('GET /');
});

router.post('/', function(req, res, next) {
    if (req.body.__action == 'add_manual_grade') {
        const note = req.body.submission_note;
        const score = req.body.submission_score;
        const params = [res.locals.instance_question.id];

        sqlDb.callZeroOrOneRow('instance_question_select_manual_grading_objects', params, (err, result) => {
            if (ERR(err, next)) return;

            const {question, variant, submission} = result.rows[0];
            if (!question || !variant || !submission) return next(error.make('500', 'Manual grading dependencies missing'));

            Object.assign(res.locals, {question, variant, submission});

            const params = [
                submission.id,
                res.locals.authn_user.user_id,
                submission.gradable,
                submission.broken,
                submission.format_errors,
                submission.partial_scores,
                score, // overwrite submission score
                submission.v2_score,
                {manual:note}, // overwrite feedback
                submission.submitted_answer,
                submission.params,
                submission.true_answer,
            ];

            sqlDb.callOneRow('grading_jobs_insert', params, (err, result) => {
                if (ERR(err, next)) return;

                /* If the submission was marked invalid during grading the grading job will
                   be marked ungradable and we should bail here to prevent LTI updates. */
                res.locals['grading_job'] = result.rows[0];
                if (!res.locals['grading_job'].gradable) return next(error.make('Invalid submission error'));

                res.locals['submission_updated'] = true;
                debug('_gradeVariantWithClient()', 'inserted', 'grading_job.id:', res.locals['grading_job'].id);
                res.render(__filename.replace(/\.js$/, '.ejs'), res.locals);
            });

        });
    } else if (req.body.__action == 'update_manual_grade') {
        //
    } else {
        return next(error.make(400, 'unknown __action', {locals: res.locals, body: req.body}));
    }
});
module.exports = router;