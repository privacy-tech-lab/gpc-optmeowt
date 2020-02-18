<template>
  <div class="hello">
    <h3>From The Database</h3>
    <ul>
      <li v-for="user in users" v-bind:key="user.id">{{ user.id }}: {{ user.first }} {{ user.last}}</li>
    </ul>
  </div>
</template>

<script>
import { db } from "@/services/firebase.js";
export default {
  name: "HelloWorld",
  data() {
    return {
      users: []
    };
  },
  created() {
    db.collection("users").onSnapshot(querySnapshot => {
      var tmp = [] // Need to take a look why I couldn't update users inside forEach
      querySnapshot.forEach(doc => {
        tmp.push({
          id: doc.id,
          first: doc.data().first,
          last: doc.data().last
        });
        this.users = tmp
      });
    });
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
