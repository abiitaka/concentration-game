import React from 'react';
import Square from './Square';
import firebase from 'firebase/app';
import { firebaseAuth } from './firebase/index'
import { firebaseDb } from './firebase/index'

class Board extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            user: null,
            squares: Array(12).fill(null),
            gameBoard: [],
            history: [],
            clickCount: 1,
            isPair: false,
            pairCount: 0,
            startTime: null,
            gametime: null,
            isStart: false,
        };
        this.newGame = this.newGame.bind(this);
    }

    componentDidMount() {
        firebaseAuth.onAuthStateChanged(user => {
            this.setState({ user })
        });
    }
    
    login() {
        const provider = new firebase.auth.GoogleAuthProvider();
        firebaseAuth.signInWithRedirect(provider);
    }
    
    logout() {
        firebaseAuth.signOut();
    }

    newGame() {
        firebaseDb.collection('gameboard')
            .get()
            .then((querySnapshot) => {
                const gameboardArray = [];
                querySnapshot.forEach((doc) => {
                    gameboardArray.push(doc.data().board);
                });

                //const random = Math.floor( Math.random() * 11);
                const random = 1;
                const gameboard = gameboardArray.filter((value, index) => index === random);
                
                const boardStr = gameboard[0].split(',');
                const boardInt = [];
                boardStr.forEach((value) => {
                    boardInt.push(parseInt(value));
                });
                this.setState({
                    squares: Array(12).fill(null),
                    gameBoard: boardInt,
                    history: [],
                    clickCount: 1,
                    isPair: false,
                    pairCount: 0,
                    startTime: new Date(),
                    gametime: null,
                    isStart: true,
                });
                return;
            });
    }

    registGametime(elapsed) {
        console.log(elapsed);
        console.log(this.state.user);
        firebaseDb.collection('games')
            .add({
                user: this.state.user.displayName,
                gametime: elapsed,
                author:  this.state.user.uid,
                created: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then(doc => {
                alert("ゲームタイムをサーバに記録しました。");
                console.log(`${doc.id}をDBに追加しました。`);
            })
            .catch(error =>{
                console.log(error);
            });
    }

    handleClick(i) {
        console.log('----------------------------');

        const squares = this.state.squares.slice();
        if (squares[i] && this.state.gameBoard.length === 0) {
            return;
        }

        // 盤表示
        console.log('盤：' + this.state.gameBoard);
        squares[i] = this.state.gameBoard[i];

        // 表示履歴
        this.state.history.push(i);

        // ペア判定
        let isPair = this.isPair(this.state.history);
        let pairCount = this.state.pairCount;
        if(isPair) {
            pairCount = pairCount + 1;
        }

        this.setState({
            squares: squares,
            history: this.state.history,
            clickCount: this.state.clickCount + 1,
            isPair: isPair,
            pairCount: pairCount,
        });

        // ペア一致しない場合はボード版を戻す
        this.reverseBoard(this.state.history, squares, isPair);

        console.log('history: ' + this.state.history + ' [pairCount:' + pairCount + ']');
    }

    isPair(history) {
        if(!this.isTwoClick(history)) {
            return false;
        }

        const oneIndexHistory = history[history.length-2];
        const twoIndexHistory = history[history.length-1];
        if (this.state.gameBoard[twoIndexHistory] === this.state.gameBoard[oneIndexHistory]) {
            return true;
        } else {
            return false;
        }
    }

    isTwoClick(history) {
        const isTwoClick = history.length % 2;
        return !(isTwoClick === 1)
    }

    reverseBoard(history, squares, isPair) {
        if(!this.isTwoClick(history)) {
            return;
        }

        if(!isPair) {
            setTimeout(()=> {
                // ボードを2つ戻す
                squares[history[history.length-2]] = null;
                squares[history[history.length-1]] = null;
                this.setState({squares: squares,});
            }, 300);
        }
    }

    getGametime(elapsed) {
        const m = String(Math.floor(elapsed/1000/60)+100).substring(1);
        const s = String(Math.floor((elapsed%(1000*60))/1000)+100).substring(1);
        const ms = String(elapsed % 1000 + 1000).substring(1);
        return (+m) + "分" + (+s) + "." + ms + "秒";
    };

    renderSquare(i) {
        return (
            <Square 
                value={this.state.squares[i]} 
                onClick={() => this.handleClick(i)}
            />
        );
    }

    render() {
        const end = (this.state.squares[0] && this.state.pairCount === this.state.gameBoard.length/2);
        const elapsed =  Date.now() - this.state.startTime;
        console.log(parseInt(elapsed));

        const auth = this.state.user === null ? false : true;
        if(auth) {
            if(!this.state.isStart) {
                return (
                    <div>
                        <p>なまえ: {this.state.user.displayName}　<button onClick={this.logout}>ログアウト</button></p>
                        <p><button onClick={this.newGame}>ゲームスタート</button></p>
                    </div>
                );
            } else {
                return (
                    <div>
                        <p>なまえ: {this.state.user.displayName}　<button onClick={this.logout}>ログアウト</button></p>
                        <p><button onClick={this.newGame}>ゲームスタート</button></p>
                        <p>{end ? ('ゲームタイム　' + this.getGametime(elapsed)) : ''}</p>
    
                        <div className="board-row">
                            {this.renderSquare(0)}
                            {this.renderSquare(1)}
                            {this.renderSquare(2)}
                            {this.renderSquare(3)}
                        </div>
                        <div className="board-row">
                            {this.renderSquare(4)}
                            {this.renderSquare(5)}
                            {this.renderSquare(6)}
                            {this.renderSquare(7)}
                        </div>
                        <div className="board-row">
                            {this.renderSquare(8)}
                            {this.renderSquare(9)}
                            {this.renderSquare(10)}
                            {this.renderSquare(11)}
                        </div>
                        {end?<p><button onClick={(elapsed) => {this.registGametime(this.getGametime(elapsed))}}>ゲームタイムをサーバに記録する</button></p>:''}
                    </div>
                );
            }
        } else {
            return (
                <div>
                    <p> Googleアカウントでログインしてください。</p>
                    <p><button onClick={this.login}>ログイン</button></p>
                </div>
            );
        }
    }
}
export default Board;