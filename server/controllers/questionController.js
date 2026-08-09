const db = require("../config/db");

const addQuestion = (req, res) => {

    const {
        quiz_id,
        question,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_option,
        marks
    } = req.body;

    const sql = `
        INSERT INTO questions
        (
            quiz_id,
            question,
            option_a,
            option_b,
            option_c,
            option_d,
            correct_option,
            marks
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            quiz_id,
            question,
            option_a,
            option_b,
            option_c,
            option_d,
            correct_option,
            marks
        ],
        (err) => {
            if (err) {
                return res.status(500).json(err);
            }
            res.status(201).json({
                message: "Question Added Successfully"
            });
        }
    );

};
const getQuestionsByQuiz = (req, res) => {

    const { quiz_id } = req.params;
    const sql = `
        SELECT *
        FROM questions
        WHERE quiz_id = ?
        ORDER BY id
    `;

    db.query(sql, [quiz_id], (err, result) => {
        if (err) {
            return res.status(500).json(err);
        }
        res.status(200).json(result);
    });
};
const getQuestionById = (req, res) => {
    const { id } = req.params;
    db.query(
        "SELECT * FROM questions WHERE id=?",
        [id],
        (err, result) => {
            if (err)
                return res.status(500).json(err);
            if (result.length === 0)
                return res.status(404).json({
                    message: "Question Not Found"
                });
            res.json(result[0]);
        }
    );
};
const updateQuestion = (req, res) => {

    const { id } = req.params;

    const {
        question,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_option,
        marks
    } = req.body;

    const sql = `
        UPDATE questions
        SET
            question=?,
            option_a=?,
            option_b=?,
            option_c=?,
            option_d=?,
            correct_option=?,
            marks=?
        WHERE id=?
    `;

    db.query(
        sql,
        [
            question,
            option_a,
            option_b,
            option_c,
            option_d,
            correct_option,
            marks,
            id
        ],
        (err) => {
            if (err)
                return res.status(500).json(err);
            res.json({
                message: "Question Updated Successfully"
            });
        }
    );
};
const deleteQuestion = (req, res) => {
    const { id } = req.params;
    db.query(
        "DELETE FROM questions WHERE id=?",
        [id],
        (err) => {
            if (err)
                return res.status(500).json(err);
            res.json({
                message: "Question Deleted Successfully"
            });
        }
    );
};
module.exports = {addQuestion,getQuestionsByQuiz,getQuestionById,updateQuestion,deleteQuestion};