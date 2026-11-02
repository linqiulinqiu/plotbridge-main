import React from 'react';
export default class ErrorBoundary extends React.Component<{children:React.ReactNode;en:boolean},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true}}
 componentDidCatch(error:Error){console.error('Module rendering failed',error)}
 render(){return this.state.failed?<section role="alert"><h2>{this.props.en?'Unable to display this module':'模块暂时无法显示'}</h2><p>{this.props.en?'Retry or use the navigation to open another module.':'请重试，或通过顶部导航进入其他模块。'}</p><button onClick={()=>this.setState({failed:false})}>{this.props.en?'Retry':'重试'}</button></section>:this.props.children}
}
